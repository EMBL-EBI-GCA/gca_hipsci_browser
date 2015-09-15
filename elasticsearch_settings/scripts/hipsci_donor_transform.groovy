
ctx._source.searchable = [:]
ctx._source.searchable.fixed = []

if (ctx._source.name) {
    String name = ctx._source.name
    ctx._source.searchable.fixed << name
    name = name.replaceFirst(/^HPSI-/, '')
    ctx._source.searchable.fixed << name
}

if (ctx._source.cellLines) {
    for (line in ctx._source.cellLines) {
        String name = line.name
        ctx._source.searchable.fixed << name
        name = name.replaceFirst(/^HPSI[a-z0-9]*-/, '')
        ctx._source.searchable.fixed << name
        name = name.replaceFirst(/_[0-9]*$/, '')
        ctx._source.searchable.fixed << name
    }
}

