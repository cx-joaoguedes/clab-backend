const parseCheckmarxJSON = (data) => {
    const treated = JSON.parse(data.toString());

    const parsed = treated.Queries.flatMap(query =>
        query.Results.map(result => ({
            original_query_name: query.Metadata.QueryName,
            original_severity: query.Metadata.Severity,
            nodes: result.Nodes.flatMap(node => ({
                file_name: node.FileName,
                node_name: node.FullName,
                start_line: node.Line,
                end_line: node.Line,
                start_column: node.Column,
                end_column: node.Column + node.Length
            })),
        }))
    );

    return parsed;
};



const parseCheckmarxSARIF = (data) => {
    return []
}

module.exports = { parseCheckmarxJSON, parseCheckmarxSARIF }