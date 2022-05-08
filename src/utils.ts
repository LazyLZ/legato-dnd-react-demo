export function joinClass(...cls: any[]): string {
    return cls.flat(Infinity).filter(c => c && typeof c === 'string').join(' ')
}
