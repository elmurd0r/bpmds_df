import inherits from 'inherits';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';


/**
 * A custom rule provider that decides which association
 * an iot artefact has, based on iot type.
 *
 * See {@link BpmnRules} for the default implementation
 * of BPMN 2.0 modeling rules provided by bpmn-js.
 *
 * @param {EventBus} eventBus
 */
export default function CustomIotArtefactRules(eventBus) {
    RuleProvider.call(this, eventBus);
}

inherits(CustomIotArtefactRules, RuleProvider);

CustomIotArtefactRules.$inject = [ 'eventBus' ];


CustomIotArtefactRules.prototype.init = function() {

    // if nothing is returned default rules will be applied
    const handleAssociation = (context) => {
        let source = context.source;
        let iotTypeSource = source.businessObject.type;
        if (iotTypeSource === "actor" || iotTypeSource === "actor-sub") {
            return false;
        }
        let target = context.target;
        let iotTypeTarget = target.businessObject.type;
        if (iotTypeTarget === "sensor" || iotTypeTarget === "sensor-sub" || iotTypeTarget === "artefact-catch" || iotTypeTarget === "artefact-catch-sub") {
            return false;
        }
    }
    // priority is important
    this.addRule('connection.create', 1500, (context) => {
        if(context.source.businessObject.type === 'decision-group' || context.target.businessObject.type === 'decision-group') {
            if((context.target.type === 'bpmn:IntermediateCatchEvent' || context.target.type === 'bpmn:StartEvent' || context.target.type === 'bpmn:BoundaryEvent') && context.target.businessObject.eventDefinitions[0]['$type'] === 'bpmn:ConditionalEventDefinition') {
                return {
                    type: 'bpmn:Association'
                };
            }
            return false;
        }

        return handleAssociation(context);
    });

    this.addRule('shape.create', 1500, (context) => {
        if(context.target.businessObject.type === 'decision-group') {
            let shapeBoType = context.shape.businessObject.type;
            let creatable = shapeBoType === 'sensor' || shapeBoType === 'decision-group' || context.shape.businessObject.operator || (context.shape.type === 'bpmn:DataObjectReference' && !shapeBoType)
            return creatable;
        }
    });

    this.addRule('elements.move', 1500, (context) => {
        if ( context.target?.businessObject.type === 'decision-group') {
            let movable =  context.shapes.every(shape => shape.businessObject.type === 'sensor' || shape.businessObject.type === 'decision-group' || shape.businessObject.operator || (shape.type === 'bpmn:DataObjectReference' && !shape.businessObject.type));
            return movable;
        }
    });

    this.addRule('connection.reconnect', 1500, (context) => {
        return handleAssociation(context);
    });
};

