export const WorkflowInstancesByRunIdsQueryGQL = `
    query($runIds:[String]) {
        workflowInstances(runIds: $runIds) {
            totalCount,
            items {
                id,
                definitionId,
                definitionLabel,
                firstRunId
            }
        }
    }
`;
