
ctx._source.calculated = [:]

ctx._source.calculated.assayCount = ctx._source.assays ? ctx._source.assays.size() : 0

ctx._source.calculated.assays = []
if (ctx._source.assays) {
  if (ctx._source.assays.gtarray) ctx._source.calculated.assays << 'Genotyping array'
  if (ctx._source.assays.gexarray) ctx._source.calculated.assays << 'Expression array'
  if (ctx._source.assays.exomeseq) ctx._source.calculated.assays << 'Exome-seq'
  if (ctx._source.assays.rnaseq) ctx._source.calculated.assays << 'RNA-seq'
  if (ctx._source.assays.mtarray) ctx._source.calculated.assays << 'Methylation array'
  if (ctx._source.assays.proteomics) ctx._source.calculated.assays << 'Proteomics'
  if (ctx._source.assays['cellbiol-fn']) ctx._source.calculated.assays << 'Cellular phenotyping'
}

ctx._source.calculated.access = ctx._source.openAccess ? 'Open access' : ctx._source.openAccess != null ? 'Managed access' : ''

if (ctx._source.bankingStatus) {
  ctx._source.calculated.bankingStatus = ctx._source.bankingStatus.grep{!(it =~ /(?i)shipped/).find()}
}

ctx._source.searchable = [:]
ctx._source.searchable.fixed = []

if (ctx._source.name) {
    String name = ctx._source.name
    ctx._source.searchable.fixed << name
    name = name.replaceFirst(/^HPSI[a-z0-9]*-/, '')
    ctx._source.searchable.fixed << name
    name = name.replaceFirst(/_[0-9]*$/, '')
    ctx._source.searchable.fixed << name
}

if (ctx._source.donor && ctx._source.donor.name) {
    String name = ctx._source.donor.name
    ctx._source.searchable.fixed << name
    name = name.replaceFirst(/^HPSI-/, '')
    ctx._source.searchable.fixed << name
}

