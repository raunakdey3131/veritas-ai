// Veritas AI — Neo4j Knowledge Graph Schema
// Production schema for entity-relationship knowledge base

// ── Constraints ────────────────────────────────────────────────────────────

CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT entity_name IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE;
CREATE CONSTRAINT fact_id IF NOT EXISTS FOR (f:Fact) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT source_id IF NOT EXISTS FOR (s:Source) REQUIRE s.id IS UNIQUE;

// ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX entity_type_index IF NOT EXISTS FOR (e:Entity) ON (e.type);
CREATE INDEX entity_name_index IF NOT EXISTS FOR (e:Entity) ON (e.name);
CREATE INDEX fact_statement_index IF NOT EXISTS FOR (f:Fact) ON (f.statement);

// ── Entity Labels ──────────────────────────────────────────────────────────

// Core entity types
// :Entity {id, name, type, description, wikidata_id, confidence}

// Relationship types:
// :RELATES_TO {relation, confidence, source, verified_at, valid_from, valid_until}
// :FOUNDED_BY, :LOCATED_IN, :PRODUCES, :KNOWN_FOR, :CREATED_BY, :DISCOVERED_BY
// :HAS_PROPERTY, :PART_OF, :SUBSIDIARY_OF, :COMPETES_WITH

// ── Sample Data ──────────────────────────────────────────────────────────

CREATE (g:Entity {
    id: 'entity_001',
    name: 'Google',
    type: 'ORGANIZATION',
    description: 'American multinational technology company',
    wikidata_id: 'Q95',
    confidence: 0.99
});

CREATE (l:Entity {
    id: 'entity_002',
    name: 'Larry Page',
    type: 'PERSON',
    description: 'American computer scientist, co-founder of Google',
    wikidata_id: 'Q92936',
    confidence: 0.99
});

CREATE (s:Entity {
    id: 'entity_003',
    name: 'Sergey Brin',
    type: 'PERSON',
    description: 'American computer scientist, co-founder of Google',
    wikidata_id: 'Q92764',
    confidence: 0.99
});

CREATE (p:Entity {
    id: 'entity_004',
    name: 'Sundar Pichai',
    type: 'PERSON',
    description: 'CEO of Google and Alphabet',
    wikidata_id: 'Q6047326',
    confidence: 0.99
});

CREATE (date1998:Entity {
    id: 'entity_005',
    name: '1998',
    type: 'DATE',
    description: 'Year 1998',
    normalized_date: '1998-01-01',
    confidence: 1.0
});

CREATE (python:Entity {
    id: 'entity_006',
    name: 'Python',
    type: 'PROGRAMMING_LANGUAGE',
    description: 'High-level general-purpose programming language',
    wikidata_id: 'Q28865',
    confidence: 0.99
});

CREATE (guido:Entity {
    id: 'entity_007',
    name: 'Guido van Rossum',
    type: 'PERSON',
    description: 'Dutch programmer, creator of Python',
    wikidata_id: 'Q28862',
    confidence: 0.99
});

CREATE (date1991:Entity {
    id: 'entity_008',
    name: '1991',
    type: 'DATE',
    description: 'Year 1991',
    normalized_date: '1991-02-20',
    confidence: 1.0
});

// ── Relationships ─────────────────────────────────────────────────────────

MATCH (g:Entity {name: 'Google'})
MATCH (l:Entity {name: 'Larry Page'})
CREATE (g)-[:FOUNDED_BY {
    relation: 'founded_by',
    confidence: 0.99,
    source: 'Wikipedia',
    verified_at: datetime(),
    valid_from: date('1998-09-04'),
    valid_until: date('9999-12-31')
}]->(l);

MATCH (g:Entity {name: 'Google'})
MATCH (s:Entity {name: 'Sergey Brin'})
CREATE (g)-[:FOUNDED_BY {
    relation: 'founded_by',
    confidence: 0.99,
    source: 'Wikipedia',
    verified_at: datetime(),
    valid_from: date('1998-09-04'),
    valid_until: date('9999-12-31')
}]->(s);

MATCH (g:Entity {name: 'Google'})
MATCH (d:Entity {name: '1998'})
CREATE (g)-[:FOUNDED_ON {
    relation: 'founded_on',
    confidence: 0.99,
    source: 'Wikipedia',
    verified_at: datetime()
}]->(d);

MATCH (g:Entity {name: 'Google'})
MATCH (p:Entity {name: 'Sundar Pichai'})
CREATE (g)-[:HAS_CEO {
    relation: 'ceo',
    confidence: 0.99,
    source: 'Wikipedia',
    verified_at: datetime(),
    valid_from: date('2015-08-10'),
    valid_until: date('9999-12-31')
}]->(p);

MATCH (py:Entity {name: 'Python'})
MATCH (gu:Entity {name: 'Guido van Rossum'})
CREATE (py)-[:CREATED_BY {
    relation: 'created_by',
    confidence: 0.99,
    source: 'Wikipedia',
    verified_at: datetime()
}]->(gu);

MATCH (py:Entity {name: 'Python'})
MATCH (d:Entity {name: '1991'})
CREATE (py)-[:CREATED_ON {
    relation: 'created_on',
    confidence: 0.99,
    source: 'Wikipedia',
    verified_at: datetime()
}]->(d);

// ── Fact Nodes (versioned assertions) ───────────────────────────────────────

CREATE (f1:Fact {
    id: 'fact_001',
    statement: 'Google was founded in 1998',
    confidence: 0.99,
    created_at: datetime(),
    valid_from: date('1998-09-04'),
    valid_until: date('9999-12-31'),
    source: 'Wikipedia',
    verified: true
});

CREATE (f2:Fact {
    id: 'fact_002',
    statement: 'Google was founded by Larry Page and Sergey Brin',
    confidence: 0.99,
    created_at: datetime(),
    valid_from: date('1998-09-04'),
    valid_until: date('9999-12-31'),
    source: 'Wikipedia',
    verified: true
});

CREATE (f3:Fact {
    id: 'fact_003',
    statement: 'Python was created by Guido van Rossum',
    confidence: 0.99,
    created_at: datetime(),
    valid_from: date('1991-02-20'),
    valid_until: date('9999-12-31'),
    source: 'Wikipedia',
    verified: true
});

CREATE (f4:Fact {
    id: 'fact_004',
    statement: 'Python was first released in 1991',
    confidence: 0.99,
    created_at: datetime(),
    valid_from: date('1991-02-20'),
    valid_until: date('9999-12-31'),
    source: 'Wikipedia',
    verified: true
});

// ── Useful Queries ─────────────────────────────────────────────────────────

// Find all facts about an entity
// MATCH (e:Entity {name: 'Google'})-[r]-(related)
// RETURN e.name, type(r), related.name, r.confidence
// ORDER BY r.confidence DESC;

// Verify a specific claim
// MATCH (f:Fact)
// WHERE f.statement CONTAINS 'Google was founded'
// RETURN f.statement, f.confidence, f.source, f.verified;

// Find contradictory facts
// MATCH (e:Entity)-[r1]->(a), (e)-[r2]->(b)
// WHERE type(r1) = type(r2) AND a.name <> b.name
// RETURN e.name, type(r1), a.name, b.name;

// Temporal query: facts valid as of a specific date
// MATCH (f:Fact)
// WHERE f.valid_from <= date('2024-01-01')
// AND f.valid_until >= date('2024-01-01')
// RETURN f.statement, f.source, f.confidence;
