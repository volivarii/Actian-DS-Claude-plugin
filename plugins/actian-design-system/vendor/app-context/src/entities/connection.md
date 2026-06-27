---
# yaml-language-server: $schema=../../../schemas/app-context-entity.json
_schema_version: 1
slug: connection
label: Connection
properties:
  - name
  - { name: type, type: enum, example: "Snowflake, PostgreSQL, Oracle, SQL Server, BigQuery, Databricks, Synapse, S3, ADLS, Power BI, Tableau, Looker, Kafka, dbt, Talend (91 connectors across 16 categories)" }
  - { name: status, type: enum, states: [Connected, Error, Pending] }
  - provider
relationships:
  discoversCatalogObjects: catalog-object
apps:
  - administration
---
Configuration for a data source connector (91 pre-built across 16 categories)
