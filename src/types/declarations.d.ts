declare module 'docx' {
    export class Document {
      constructor(options: { sections: any[] });
    }
    export class Paragraph {
      constructor(text: string);
    }
    export const Packer: {
      toBlob(doc: Document): Promise<Blob>;
    };
  }
  
  declare module 'file-saver' {
    export function saveAs(blob: Blob, name: string): void;
  }
  
  declare module 'jspdf' {
    class jsPDF {
      constructor();
      text(text: string, x: number, y: number): void;
      save(filename: string): void;
    }
    export default jsPDF;
  }