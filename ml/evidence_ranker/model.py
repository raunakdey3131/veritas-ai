"""
Veritas AI — Evidence Ranker

Cross-encoder based re-ranker for evidence relevance.
Ranks retrieved evidence by relevance to the claim.
"""

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

class EvidenceRanker(nn.Module):
    """
    Re-ranks evidence passages by relevance to a claim.
    Uses cross-encoder architecture for fine-grained relevance scoring.
    """

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.classifier = nn.Linear(self.encoder.config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        outputs = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        cls = outputs.last_hidden_state[:, 0, :]
        scores = self.classifier(cls).squeeze(-1)
        return scores

    def rank(self, claim: str, passages: list[str]) -> list[dict]:
        inputs = self.tokenizer(
            [claim] * len(passages),
            passages,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        with torch.no_grad():
            scores = self.forward(inputs["input_ids"], inputs["attention_mask"])

        ranked = sorted(
            [{"passage": p, "score": s.item()} for p, s in zip(passages, scores)],
            key=lambda x: x["score"],
            reverse=True,
        )
        return ranked
