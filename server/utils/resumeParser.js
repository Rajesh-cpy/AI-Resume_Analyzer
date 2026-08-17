import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function parseResume(fileBuffer) {
  const startTime = Date.now();

  try {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Received empty PDF buffer.");
    }

    const uint8Array = new Uint8Array(
      fileBuffer.buffer,
      fileBuffer.byteOffset,
      fileBuffer.byteLength
    );

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      disableFontFace: true,
      useSystemFonts: false,
    });

    const pdf = await loadingTask.promise;

    console.log(`PDF pages: ${pdf.numPages}`);

    // Protect server from absurdly large PDFs.
    if (pdf.numPages > 20) {
      throw new Error(
        "Resume PDF cannot contain more than 20 pages."
      );
    }

    // Process pages concurrently instead of waiting
    // for every page one-by-one.
    const pagePromises = [];

    for (
      let pageNum = 1;
      pageNum <= pdf.numPages;
      pageNum++
    ) {
      pagePromises.push(
        pdf.getPage(pageNum).then(async (page) => {
          const content = await page.getTextContent();

          return content.items
            .map((item) => item.str || "")
            .join(" ");
        })
      );
    }

    const pages = await Promise.all(pagePromises);

    const extractedText = pages
      .join("\n")
      .replace(/\s+/g, " ")
      .trim();

    console.log(
      `PDF extraction completed in ${
        Date.now() - startTime
      }ms`
    );

    return extractedText;

  } catch (error) {
    console.error(
      "PDF Parsing Error:",
      error.message
    );

    throw error;
  }
}
