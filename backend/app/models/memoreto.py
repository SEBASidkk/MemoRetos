from backend import db
from datetime import datetime
import json

class Memoreto(db.Model):
    __tablename__ = "memoretos"

    id            = db.Column(db.Integer, primary_key=True)
    title         = db.Column(db.String(128), nullable=False)
    nivel         = db.Column(db.Integer,     nullable=False)
    fase          = db.Column(db.Integer,     nullable=True)
    dificultad    = db.Column(db.String(8), nullable=False, default="easy")
    figuras_json  = db.Column(db.Text, nullable=False)
    number_set    = db.Column(db.Text, nullable=False)
    solution_json = db.Column(db.Text, nullable=True)
    is_validated  = db.Column(db.Boolean, default=False)
    is_published  = db.Column(db.Boolean, default=False)
    created_by    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def _parse(self, raw):
        if raw is None:
            return None
        if isinstance(raw, str):
            return json.loads(raw)
        return raw

    def to_dict(self, full=False):
        data = {
            "id":           self.id,
            "title":        self.title,
            "nivel":        self.nivel,
            "fase":         self.fase,
            "dificultad":   self.dificultad,
            "is_published": self.is_published,
            "is_validated": self.is_validated,
            "number_set":   self._parse(self.number_set),
        }
        if full:
            figuras = self._parse(self.figuras_json) or []
            data["figuras"]        = figuras
            data["intersecciones"] = self._calc_intersecciones(figuras)
        return data

    def _calc_intersecciones(self, figuras):
        from collections import defaultdict
        nodo_figuras = defaultdict(list)
        for fig in figuras:
            for nodo in fig.get("nodos", []):
                nodo_figuras[nodo].append(fig.get("type", ""))
        return [
            {"nodo": nodo, "figuras": tipos}
            for nodo, tipos in nodo_figuras.items()
            if len(tipos) > 1
        ]
