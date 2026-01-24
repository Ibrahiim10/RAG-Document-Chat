export async function processDocument(
  file: File,
): Promise<{ content: string; chunks: string[] }> {
  try {
    // Get the file extension (pdf, docx, text, etc)
    // Examples: "document.pdf" becomes 'pdf

    const fileType = file.name.split('.').pop()?.toLowerCase();
    let content = '';

    // Choose the right processing method based on file type
    switch (fileType) {
      case 'pdf':
        console.log('Processing PDF file:', file.name);
        content = await processPDF(file);
        break;
      case 'docx':
        console.log('Processing DOCX file:', file.name);
        // content = await processDOCX(file);
        break;
      case 'txt':
      case 'md':
        console.log('Processing text file:', file.name);
        // content = await processText(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // TODO: Create chunks from the content

    // TODO:
    return { content: '', chunks: [] };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

async function processPDF(file: File): Promise<string> {
  try {
    const { PDFLoader } =
      await import('@langchain/community/document_loaders/fs/pdf');

    // convert to blob for langchain

    const blob = new Blob([await file.arrayBuffer()], {
      type: 'application/pdf',
    });

    // create pdf loader
    const loader = new PDFLoader(blob);

    // load the document
    const docs = await loader.load();

    console.log(`PDF loaded successfully with ${docs.length} pages`);

    // combine all pages into single text
    let fullText = '';
    docs.forEach((doc, index) => {
      if (doc.pageContent.trim()) {
        fullText += `\n\npage ${index + 1} : \n${doc.pageContent.trim()}`;
      }
    });

    if (!fullText.trim()) {
      return `No text content could be extracted from ${file.name}. The PDF might be image-based or encrypted.`;
    }
    console.log('PDF processing complete. Text length:', fullText.length);
    return fullText.trim();
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}
