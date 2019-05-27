import { EntitySchema, EntitySchemaColumnOptions } from 'typeorm'
import { EntitySchemaOptions } from 'typeorm/entity-schema/EntitySchemaOptions';
import { StorageRegistry } from '@worldbrain/storex'
import { CollectionDefinition, isChildOfRelationship, isConnectsRelationship, CollectionField } from '@worldbrain/storex/lib/types'

const FIELD_TYPE_MAP : {[name : string] : EntitySchemaColumnOptions} = {
    'auto-pk': {
        type: 'integer',
        generated: true,
        primary: true
    },
    'text': { type: 'text' },
    'json': { type: 'json' },
    'datetime': { type: 'datetime' },
    'timestamp': { type: 'timestamp' },
    'string': { type: 'text' },
    'boolean': { type: 'tinyint' },
    'int': { type: 'integer' },
    'float': { type: 'float' },
}

export function collectionsToEntitySchemas(storageRegistry : StorageRegistry) : {[collectionName : string] : EntitySchema} {
    const schemas : {[collectionName : string] : EntitySchema} = {}
    for (const [collectionName, collectionDefinition] of Object.entries(storageRegistry.collections)) {
        schemas[collectionName] = collectionToEntitySchema(collectionDefinition)
    }
    return schemas
}

export function collectionToEntitySchema(collectionDefinition : CollectionDefinition) : EntitySchema {
    const entitySchemaOptions : EntitySchemaOptions<any> = {
        name: collectionDefinition.name!,
        columns: {}
    }
    for (const [fieldName, fieldDefinition] of Object.entries(collectionDefinition.fields)) {
        if (fieldDefinition.type == 'foreign-key') {
            continue
        }

        const columsOptions : EntitySchemaColumnOptions = fieldToEntitySchemaColumn(fieldDefinition, {
            collectionName: entitySchemaOptions.name,
            fieldName,
        })
        
        if (collectionDefinition.pkIndex === fieldName) {
            columsOptions.primary = true
        }

        entitySchemaOptions.columns[fieldName] = columsOptions
    }

    return new EntitySchema(entitySchemaOptions)
}

export function fieldToEntitySchemaColumn(fieldDefinition : CollectionField, options : { collectionName : string, fieldName : string }) : EntitySchemaColumnOptions {
    const primitiveType = fieldDefinition.fieldObject ? fieldDefinition.fieldObject.primitiveType : fieldDefinition.type
    
    const columnOptions = FIELD_TYPE_MAP[primitiveType] && {...FIELD_TYPE_MAP[primitiveType]}
    if (!columnOptions) {
        throw new Error(`Unknown field type for field '${options.fieldName}' of collection '${options.collectionName}': '${primitiveType}'`)
    }

    if (fieldDefinition.optional) {
        columnOptions.nullable = true
    }

    return columnOptions
}

// export function connectSequelizeModels({registry, models} : {registry : StorageRegistry, models : {[name : string] : any}}) {
//     for (const [collectionName, collectionDefinition] of Object.entries(registry.collections)) {
//         for (const relationship of collectionDefinition.relationships || []) {
//             if (isChildOfRelationship(relationship)) {
//                 const targetModel = models[relationship.targetCollection!]
//                 if (!targetModel) {
//                     throw new Error(
//                         `Collection ${collectionName} defines a (single)childOf relationship` +
//                         `involving non-existing collection ${relationship.targetCollection}`
//                     )
//                 }

//                 if (relationship.single) {
//                     targetModel.hasOne(models[collectionName], {
//                         foreignKey: relationship.fieldName
//                     })
//                 } else {
//                     targetModel.hasMany(models[collectionName], {
//                         foreignKey: relationship.fieldName
//                     })
//                 }
//             } else if (isConnectsRelationship(relationship)) {
//                 const getModel = (targetCollectionName : string) => {
//                     const model = models[targetCollectionName]
//                     if (!model) {
//                         throw new Error(
//                             `Collection ${collectionName} defines a connects relationship` +
//                             `involving non-existing collection ${targetCollectionName}`
//                         )
//                     }
//                     return model
//                 }
//                 const leftModel = getModel(relationship.connects[0])
//                 const rightModel = getModel(relationship.connects[1])

//                 leftModel.belongsToMany(rightModel, {through: collectionName, foreignKey: relationship.fieldNames![0]})
//                 rightModel.belongsToMany(leftModel, {through: collectionName, foreignKey: relationship.fieldNames![1]})
//             }
//         }
//     }
// }