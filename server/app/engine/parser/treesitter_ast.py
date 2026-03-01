import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript
import tree_sitter_typescript as tstypescript
from tree_sitter import Language, Parser

class ASTParser:
    def __init__(self):
        # Initialize generic parser and load languages
        self.py_lang = Language(tspython.language())
        self.js_lang = Language(tsjavascript.language())
        
        try:
            self.ts_lang = Language(tstypescript.language_typescript())
            self.tsx_lang = Language(tstypescript.language_tsx())
        except AttributeError:
            self.ts_lang = Language(tstypescript.language())
            self.tsx_lang = Language(tstypescript.language())
        
        self.parsers = {
            ".py": self._create_parser(self.py_lang),
            ".js": self._create_parser(self.js_lang),
            ".jsx": self._create_parser(self.js_lang),
            ".ts": self._create_parser(self.ts_lang),
            ".tsx": self._create_parser(self.tsx_lang)
        }

    def _create_parser(self, lang: Language) -> Parser:
        parser = Parser()
        parser.language = lang
        return parser

    def parse_file(self, file_path: str, content: bytes, extension: str) -> dict:
        """
        Extracts dependencies/imports and class/function signatures from the file content.
        This is a heavily simplified extraction optimized for < 1ms parsing per file.
        """
        if extension not in self.parsers:
            return {"imports": [], "signatures": [], "raw_text": content.decode('utf-8', errors='ignore')}
        
        parser = self.parsers[extension]
        tree = parser.parse(content)
        
        imports = self._extract_imports(tree.root_node, extension, content)
        signatures = self._extract_signatures(tree.root_node, extension, content)
        
        return {
            "imports": imports,
            "signatures": signatures,
            "raw_text": content.decode('utf-8', errors='ignore')
        }

    def _extract_imports(self, node, ext, content) -> list:
        # A crude AST traversal to find import statements. 
        # For production use, Tree-sitter Queries are much faster.
        imports = []
        if ext == ".py":
            for child in node.children:
                if child.type in ["import_statement", "import_from_statement"]:
                    imports.append(child.text.decode('utf8'))
        elif ext in [".js", ".ts", ".jsx", ".tsx"]:
            for child in node.children:
                if child.type == "import_statement":
                    imports.append(child.text.decode('utf8'))
        return imports

    def _extract_signatures(self, node, ext, content) -> list:
        signatures = []
        if ext == ".py":
            for child in node.children:
                if child.type in ["function_definition", "class_definition"]:
                    signatures.append(child.text.decode('utf8').split('\n')[0])
        elif ext in [".js", ".ts", ".jsx", ".tsx"]:
            for child in node.children:
                if child.type in ["function_declaration", "class_declaration"]:
                    signatures.append(child.text.decode('utf8').split('\n')[0])
                elif child.type == "lexical_declaration":
                    signatures.append(child.text.decode('utf8').split('\n')[0])
        return signatures
