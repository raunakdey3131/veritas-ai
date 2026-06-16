"""
Veritas AI — Hallucination Classifier

End-to-end hallucination detection model using cross-encoder
with multi-modal inputs: claim, evidence, citation status.
"""

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

class HallucinationClassifier(nn.Module):
    """
    Binary + multi-class hallucination classifier.
    Inputs: [CLS] claim [SEP] evidence [SEP] citation_context
    Outputs: hallucination probability, risk level
    """

    def __init__(self, model_name: str = "microsoft/deberta-v3-base"):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        hidden_size = self.encoder.config.hidden_size

        self.binary_classifier = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1),
            nn.Sigmoid(),
        )

        self.multi_classifier = nn.Sequential(
            nn.Linear(hidden_size, 256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, 5),  # 5 risk levels
        )

    def forward(self, input_ids, attention_mask):
        outputs = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        pooled = outputs.pooler_output

        hallucination_prob = self.binary_classifier(pooled).squeeze(-1)
        risk_logits = self.multi_classifier(pooled)

        return {
            "hallucination_prob": hallucination_prob,
            "risk_logits": risk_logits,
        }

    def predict(self, claim: str, evidence: str) -> dict:
        inputs = self.tokenizer(
            claim,
            evidence,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        )

        with torch.no_grad():
            outputs = self(**inputs)

        risk_probs = torch.softmax(outputs["risk_logits"], dim=-1)
        risk_levels = ["HIGHLY_RELIABLE", "MOSTLY_RELIABLE", "NEEDS_VERIFICATION",
                        "LIKELY_HALLUCINATED", "HIGHLY_HALLUCINATED"]

        return {
            "hallucination_prob": outputs["hallucination_prob"].item(),
            "risk_level": risk_levels[risk_probs[0].argmax().item()],
            "risk_probs": {l: risk_probs[0][i].item() for i, l in enumerate(risk_levels)},
        }
