export declare class Tag {
    private filepath;
    private binPath;
    constructor(filepath: string, binPath: string);
    addTag(tag: string): Promise<void>;
    removeTag(tag: string): Promise<void>;
}
//# sourceMappingURL=tag.d.ts.map