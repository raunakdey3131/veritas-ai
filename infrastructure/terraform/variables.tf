variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "veritas-ai-prod"
}

variable "primary_region" {
  description = "Primary GCP region"
  type        = string
  default     = "us-central1"
}

variable "secondary_region" {
  description = "Secondary/failover GCP region"
  type        = string
  default     = "us-east1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}
