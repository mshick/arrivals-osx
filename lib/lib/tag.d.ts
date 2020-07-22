export declare class Tag {
    private filepath;
    constructor(filepath: string);
    addTag(tag: string): Promise<void>;
    removeTag(tag: string): Promise<void>;
    replaceTag(tag: string, replacement: string): Promise<void>;
}
//# sourceMappingURL=tag.d.ts.map