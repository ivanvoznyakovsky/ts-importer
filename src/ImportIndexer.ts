import { TypeScriptImporter } from './TypeScriptImporter';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';

const BATCH_SIZE = 50;

export class ImportIndexer
{
    private scanStarted: Date;
    private scanEnded: Date;
    private paths: string[];
    private filesToScan: string;
    

    constructor( protected importer: TypeScriptImporter )
    {
        this.filesToScan = this.importer.conf<string>('filesToScan');

        var tsconfig: any;

        try
        {
            tsconfig = JSON.parse( fs.readFileSync( vscode.workspace.rootPath + "/tsconfig.json" ).toString() )
        }
        catch( e )
        {
            tsconfig = undefined;
        }

        if( tsconfig && tsconfig.compilerOptions )
        {
            this.paths = tsconfig.compilerOptions.paths ? tsconfig.compilerOptions.paths["*"] : undefined;

            if( this.paths )
            {
                for( let i=0; i<this.paths.length; i++ )
                {
                    let p: string[] = path.resolve( vscode.workspace.rootPath, this.paths[i] ).split( /[\/\\]/ );
                    p[ p.length - 1 ] = "";

                    this.paths[i] = p.join( "/" );
                }
            }
            else
                this.paths = [];
        }
        else
            this.paths = [];

        this.attachFileWatcher();
    }

    private attachFileWatcher(): void
    {
        let watcher = vscode.workspace.createFileSystemWatcher( this.filesToScan );

        var batch: vscode.Uri[] = [];
        var batchTimeout: any = undefined;

        var batchHandler = () => {
            batchTimeout = undefined;
            this.processWorkspaceFiles( batch.splice( 0, batch.length ), false, true );
        }

        var addBatch = ( file: vscode.Uri ) => {
            batch.push( file );

            if( batchTimeout )
            {
                clearTimeout( batchTimeout );
                batchTimeout = undefined;
            }

            batchTimeout = setTimeout( batchHandler, 250 );
        }

        watcher.onDidChange((file: vscode.Uri) => {
            addBatch( file );
        });

        watcher.onDidCreate((file: vscode.Uri) => {
            addBatch( file );
        });

        watcher.onDidDelete((file: vscode.Uri) => {
            this.fileDeleted( file );
        });
    }

    public scanAll( showNotifications: boolean ): void 
    {
        this.scanStarted = new Date();
            
        vscode.workspace
            .findFiles(this.filesToScan, '**/node_modules/**', 99999)
            .then((files) => this.processWorkspaceFiles( files, showNotifications, false ) );
    }

    private fileDeleted( file: vscode.Uri ): void
    {
        this.importer.index.deleteByPath( file.fsPath );
        this.printSummary();
    }

    private printSummary(): void
    {
        this.importer.setStatusBar( "Symbols: " + this.importer.index.symbolCount );
    }

    private processWorkspaceFiles( files: vscode.Uri[], showNotifications: boolean, deleteByFile: boolean ): void 
    {
        files = files.filter((f) => {
            return f.fsPath.indexOf('typings') === -1 &&
                f.fsPath.indexOf('node_modules') === -1 &&
                f.fsPath.indexOf('jspm_packages') === -1;
        });

        var fi = 0; 

        var next = () => {
            for( var x = 0; x < BATCH_SIZE && fi < files.length; x++)
            {
                this.importer.setStatusBar( "processing " + fi + "/" + files.length  );

                var file = files[fi++];

                try
                {
                    var data = fs.readFileSync( file.fsPath, 'utf8' );
                    this.processFile(data, file, deleteByFile);
                }
                catch( err )
                {
                    console.log( "Failed to loadFile", err );
                }

                if( fi == files.length )
                {
                    this.scanEnded = new Date();

                    this.printSummary();

                    if ( showNotifications ) 
                        this.importer.showNotificationMessage( `cache creation complete - (${Math.abs(<any>this.scanStarted - <any>this.scanEnded)}ms)` );

                    return;
                }
            }
            
            //loop async
            setTimeout( next, 0 );
        };

        next();
    }


    private processFile( data: string, file: vscode.Uri, deleteByFile: boolean ): void 
    {
        if( deleteByFile )
            this.importer.index.deleteByPath( file.fsPath );

        var fsPath = file.fsPath.replace( /[\/\\]/g, "/" );

        var extIdx = fsPath.indexOf( ".", fsPath.lastIndexOf( "/" ) );
        if( extIdx > 0 )
            fsPath = fsPath.substr( 0, extIdx );

        var path = file.fsPath;
        var module = undefined;

        for( var i=0; i<this.paths.length; i++ )
        {
            var p = this.paths[i]
            if( fsPath.substr( 0, p.length ) == p )
            {
                module = fsPath.substr( p.length );
                break;
            }
        }

        var typesRegEx = /(export\s+((?:(?:abstract\s+)?class)|(?:type)|(?:interface)|(?:function)|(?:let)|(?:var)|(?:const)|(?:enum)))\s+([a-zA-z]\w*)/g;
        var typeMatches: string[];
        while ( ( typeMatches = typesRegEx.exec( data ) ) ) 
        {   
            let symbolType: string = typeMatches[2];
            let symbolName: string = typeMatches[3];
            this.importer.index.addSymbol( symbolName, module, path, symbolType );
        }

        var importRegEx = /\bimport\s+(?:{?\s*(.+?)\s*}?\s+from\s+)?[\'"]([^"\']+)["\']/g;
        var imports: string[];
        while( imports = importRegEx.exec( data ) ) 
        {
            let importModule = imports[2];

            if( importModule.indexOf( './' ) < 0 && importModule.indexOf( '!' ) < 0)
            {
                let symbols = imports[1].split( /\s*,\s*/g );

                for( var s = 0; s < symbols.length; s++ )
                {
                    let symbolName: string = symbols[s];
                    this.importer.index.addSymbol( symbolName, importModule, undefined, undefined );
                }
            }
        }
    }
}