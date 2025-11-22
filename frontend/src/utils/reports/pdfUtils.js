import pdfMake from "pdfmake/build/pdfmake";

export const initPdfMake = async () => {
    try {
        const pdfFonts = await import("pdfmake/build/vfs_fonts");
        if (pdfFonts.pdfMake?.vfs) {
            pdfMake.vfs = pdfFonts.pdfMake.vfs;
        } else if (pdfFonts.default?.pdfMake?.vfs) {
            pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
        } else if (pdfFonts.default?.vfs) {
            pdfMake.vfs = pdfFonts.default.vfs;
        }
    } catch (error) {
        console.error("Failed to load pdfMake fonts:", error);
    }
};

initPdfMake();
