const parseSnykJSON = (data) => {
    return []
}

const parseSnykSARIF = (data) => {
    const treatedData = JSON.parse(data.toString())
    const runData = treatedData.runs[0]
    const rulesData = runData.tool.driver.rules
    const resultsData = runData.results.flatMap(result => {
        const ruleMetadata = getRuleData(result.ruleId, rulesData)
        const original_query_name = ruleMetadata.name
        const original_severity = result.level
        const nodes = result.codeFlows[0].threadFlows[0].locations.flatMap(item => {
            const nodeMetadata = item.location.physicalLocation.artifactLocation
            const nodeRegion = item.location.physicalLocation.region
            return {
                file_name: nodeMetadata.uri,
                start_line: nodeRegion.startLine,
                end_line: nodeRegion.endLine,
                start_column: nodeRegion.startColumn,
                end_column: nodeRegion.endColumn,
                node_name: null
            }
        })
        return { original_query_name, original_severity, nodes }
    })

    return resultsData
}

const getRuleData = (ruleId, rulesData) => {
    return rulesData.find(obj => obj.id === ruleId);
};

module.exports = { parseSnykJSON, parseSnykSARIF }