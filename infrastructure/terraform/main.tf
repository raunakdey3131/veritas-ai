# Veritas AI — Terraform Infrastructure
# Multi-region GKE deployment

terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
  backend "gcs" {
    bucket = "veritas-terraform-state"
    prefix = "prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.primary_region
}

# ── VPC ──────────────────────────────────────────────────────────────────────

resource "google_compute_network" "vpc" {
  name                    = "veritas-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "veritas-subnet"
  network       = google_compute_network.vpc.id
  region        = var.primary_region
  ip_cidr_range = "10.0.0.0/16"
  private_ip_google_access = true
}

# ── GKE Cluster ─────────────────────────────────────────────────────────────

resource "google_container_cluster" "primary" {
  name     = "veritas-cluster"
  location = var.primary_region

  network    = google_compute_network.vpc.id
  subnetwork = google_compute_subnetwork.subnet.id

  initial_node_count = 3

  node_config {
    machine_type = "n2-standard-8"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
    labels = {
      environment = "production"
    }
  }

  node_pool {
    name       = "gpu-pool"
    node_count = 6
    node_config {
      machine_type = "g2-standard-8"
      guest_accelerator {
        type  = "nvidia-l4"
        count = 1
      }
    }
  }

  node_pool {
    name       = "memory-pool"
    node_count = 4
    node_config {
      machine_type = "n2-highmem-16"
    }
  }

  release_channel {
    channel = "STABLE"
  }

  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }
}

# ── Cloud SQL (PostgreSQL) ─────────────────────────────────────────────────

resource "google_sql_database_instance" "postgres" {
  name             = "veritas-postgres"
  database_version = "POSTGRES_16"
  region           = var.primary_region

  settings {
    tier              = "db-custom-8-32768"
    availability_type = "REGIONAL"
    disk_type         = "SSD"
    disk_size         = "500"
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
    }
  }

  deletion_protection = true
}

# ── Memorystore (Redis) ─────────────────────────────────────────────────────

resource "google_redis_instance" "cache" {
  name           = "veritas-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 16
  region         = var.primary_region
  read_replicas_mode = "READ_REPLICAS_ENABLED"
  replica_count     = 2
}

# ── IAM ─────────────────────────────────────────────────────────────────────

resource "google_project_iam_member" "sa_roles" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:veritas-sa@${var.project_id}.iam.gserviceaccount.com"
}

# ── Outputs ─────────────────────────────────────────────────────────────────

output "cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

output "postgres_ip" {
  value = google_sql_database_instance.postgres.public_ip_address
}
