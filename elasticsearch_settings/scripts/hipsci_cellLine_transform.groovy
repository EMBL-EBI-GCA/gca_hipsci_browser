
ctx._source.calculated = [:]
ctx._source.searchable = [:]
ctx._source.searchable.fixed = []
ctx._source.searchable.free = []

ctx._source.calculated.assayCount = ctx._source.assays ? ctx._source.assays.size() : 0

if (ctx._source.assays) {
  for (assay in ctx._source.assays) {
      if (assay.name && (assay.name == 'Genotyping array')) {
          ctx._source.searchable.free << 'genotyping'
      }
      if (assay.name && (assay.name == 'Expression array')) {
          ctx._source.searchable.free << 'expression'
      }
      if (assay.name && (assay.name == 'Exome-seq')) {
          ctx._source.searchable.free << 'exome'
      }
      if (assay.name && (assay.name == 'RNA-seq')) {
          ctx._source.searchable.free << 'rnaseq'
          ctx._source.searchable.fixed << 'RNA-seq'
      }
      if (assay.name && (assay.name == 'Methylation array')) {
          ctx._source.searchable.free << 'methylation'
      }
      if (assay.name && (assay.name == 'Proteomics')) {
          ctx._source.searchable.free << 'proteomics'
      }
      if (assay.name && (assay.name == 'Whole genome sequencing')) {
          ctx._source.searchable.free << 'wgs'
      }
  }
}

ctx._source.calculated.access = ctx._source.openAccess ? 'Open access' : ctx._source.openAccess != null ? 'Managed access' : ''

if (ctx._source.bankingStatus) {
  ctx._source.calculated.bankingStatus = ctx._source.bankingStatus.grep{!(it =~ /(?i)shipped/).find()}
}


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

