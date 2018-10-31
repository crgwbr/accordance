import * as t from 'io-ts';
declare const AccordanceConfig: t.IntersectionType<[t.InterfaceType<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}, t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}>, t.OutputOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}>, unknown>, t.PartialType<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}, t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>, t.OutputOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>, unknown>], t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>, t.OutputOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}> & t.OutputOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>, unknown>;
export declare type IAccordanceConfig = t.TypeOf<typeof AccordanceConfig>;
export declare const readConfig: (configPath: string, encoding?: string) => t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>;
export declare const getAnyMatchIgnorePatterns: (rootPath: string, rules: string[]) => string[];
export declare const getUnisonConfigPath: (config: t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>) => string;
export declare const buildUnisonConfig: (config: t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>) => string;
export declare const writeUnisonConfigFile: (config: t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, unknown>;
    remote: t.InterfaceType<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }, t.TypeOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, t.OutputOfProps<{
        username: t.StringType;
        host: t.StringType;
        root: t.StringType;
    }>, unknown>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", unknown>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], unknown>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, unknown>;
}>) => void;
export {};
//# sourceMappingURL=config.d.ts.map