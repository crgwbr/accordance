import * as t from 'io-ts';
declare const AccordanceConfig: t.IntersectionType<[t.InterfaceType<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}, t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}>, t.OutputOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}>, t.mixed>, t.PartialType<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}, t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}>, t.OutputOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}>, t.mixed>], t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}>, t.OutputOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}> & t.OutputOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}>, t.mixed>;
export declare type IAccordanceConfig = t.TypeOf<typeof AccordanceConfig>;
export declare const readConfig: (configPath: string, encoding?: string) => t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
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
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}>) => string;
export declare const buildUnisonConfig: (config: t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}>) => string;
export declare const writeUnisonConfigFile: (config: t.TypeOfProps<{
    name: t.StringType;
    local: t.InterfaceType<{
        root: t.StringType;
    }, t.TypeOfProps<{
        root: t.StringType;
    }>, t.OutputOfProps<{
        root: t.StringType;
    }>, t.mixed>;
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
    }>, t.mixed>;
    prefer: t.UnionType<(t.LiteralType<"local"> | t.LiteralType<"remote">)[], "local" | "remote", "local" | "remote", t.mixed>;
}> & t.TypeOfPartialProps<{
    syncIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    watchIgnore: t.ArrayType<t.StringType, string[], string[], t.mixed>;
    options: t.DictionaryType<t.StringType, t.BooleanType, t.TypeOfDictionary<t.StringType, t.BooleanType>, t.OutputOfDictionary<t.StringType, t.BooleanType>, t.mixed>;
}>) => void;
export {};
//# sourceMappingURL=config.d.ts.map