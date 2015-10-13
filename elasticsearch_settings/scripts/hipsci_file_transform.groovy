
ctx._source.calculated = [:]

ctx._source.calculated.access = ctx._source.archive.openAccess ? 'Open access' : ctx._source.archive.openAccess != null ? 'Managed access' : ''

ctx._source.searchable = [:]
ctx._source.searchable.fixed = []

if (ctx._source.samples) {
    for (sample in ctx._source.samples) {
        if (sample.name) {
            String name = sample.name
            ctx._source.searchable.fixed << name
            name = name.replaceFirst(/^HPSI[a-z0-9]*-/, '')
            ctx._source.searchable.fixed << name
            name = name.replaceFirst(/_[0-9]*$/, '')
            ctx._source.searchable.fixed << name
        }
    }
}
