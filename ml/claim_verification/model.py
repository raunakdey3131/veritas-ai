"""
Veritas AI — Claim Verification Model

Production NLI-based claim verification using fine-tuned transformer.
"""

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer, AutoConfig

class ClaimVerifier(nn.Module):
    """
    Multi-task model for claim verification:
    1. Entailment/Contradiction/Neutral classification
    2. Support score regression
    3. Confidence estimation
    """

    def __init__(self, model_name: str = "roberta-large", num_labels: int = 3):
        super().__init__()
        self.config = AutoConfig.from_pretrained(model_name)
        self.config.num_labels = num_labels
        self.encoder = AutoModel.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        hidden_size = self.config.hidden_size

        # Task heads
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_size, num_labels),
        )

        self.support_regressor = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(256, 1),
            nn.Sigmoid(),
        )

        self.confidence_estimator = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(256, 1),
            nn.Sigmoid(),
        )

    def forward(self, input_ids, attention_mask, token_type_ids=None):
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
        )
        pooled = outputs.pooler_output

        logits = self.classifier(pooled)
        support = self.support_regressor(pooled)
        confidence = self.confidence_estimator(pooled)

        return {
            "logits": logits,
            "support_score": support.squeeze(-1),
            "confidence": confidence.squeeze(-1),
        }

    def predict(self, claim: str, evidence: str) -> dict:
        inputs = self.tokenizer(
            claim,
            evidence,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        with torch.no_grad():
            outputs = self(**inputs)

        probs = torch.softmax(outputs["logits"], dim=-1)
        labels = ["CONTRADICTION", "NEUTRAL", "ENTAILMENT"]
        predicted = labels[probs[0].argmax().item()]

        return {
            "verdict": predicted,
            "entailment_prob": probs[0][2].item(),
            "contradiction_prob": probs[0][0].item(),
            "neutral_prob": probs[0][1].item(),
            "support_score": outputs["support_score"].item(),
            "confidence": outputs["confidence"].item(),
        }
