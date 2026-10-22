/** Phones and low-core machines get a lighter render: no depth of field, no MSAA, smaller shadow maps */
export const isLowPower = () => window.innerWidth < 720 || (navigator.hardwareConcurrency ?? 8) <= 4
