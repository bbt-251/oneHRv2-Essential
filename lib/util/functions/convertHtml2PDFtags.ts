export function convertHtml2PDFtags(html: string): string {
    let htmlCopy = html;
    // Replace <p> tags with <Text> tags with style intact
    htmlCopy = htmlCopy.replace(/<p([^>]*)>/g, "<Text$1>");
    htmlCopy = htmlCopy.replace(/<span[^>]*>/g, "<Text style={{}}>");

    // Replace h1,h2,h3,h4,h5,h6  with the corresponding tag in React pdf
    htmlCopy = htmlCopy.replace(/<h1>/g, '<Text style={{"fontWeight":"bold","fontSize":"25px"}}>');
    htmlCopy = htmlCopy.replace(/<h2>/g, '<Text style={{"fontWeight":"bold","fontSize":"17px"}}>');
    htmlCopy = htmlCopy.replace(/<h3>/g, '<Text style={{"fontWeight":"bold","fontSize":"15px"}}>');
    htmlCopy = htmlCopy.replace(/<h4>/g, '<Text style={{"fontWeight":"bold","fontSize":"12px"}}>');
    htmlCopy = htmlCopy.replace(
        /<h5>/g,
        '<Text style={{"fontWeight":"bold","fontSize":"10.28px"}}>',
    );
    htmlCopy = htmlCopy.replace(
        /<h6>/g,
        '<Text style={{"fontWeight":"bold","fontSize":"8.72px"}}>',
    );

    // Replace <strong>, <em>, <ins>, <del>, <sub>, <sup> tags with corresponding <Text> tags and styles
    htmlCopy = htmlCopy.replace(/<strong>/g, '<Text style={{"fontWeight":"bold"}}>');
    htmlCopy = htmlCopy.replace(/<em>/g, '<Text style={{"fontStyle": "italic"}}>');
    htmlCopy = htmlCopy.replace(/<ins>/g, '<Text style={{"textDecoration": "underline"}}>');
    htmlCopy = htmlCopy.replace(/<del>/g, '<Text style={{"textDecoration": "line-through"}}>');
    htmlCopy = htmlCopy.replace(/<sub>/g, '<Text style={{"verticalAlign":"sub"}}>');
    htmlCopy = htmlCopy.replace(/<sup>/g, '<Text style={{"verticalAlign":"super"}}>');

    //Replace "text-align:center;", "text-align:right;" , "text-align:justify;" with corresponding <Text> tags
    htmlCopy = htmlCopy.replace(/"text-align:center;"/g, '{{"textAlign":"center"}}');
    htmlCopy = htmlCopy.replace(/"text-align:left;"/g, '{{"textAlign":"left"}}');
    htmlCopy = htmlCopy.replace(/"text-align:right;"/g, '{{"textAlign":"right"}}');
    htmlCopy = htmlCopy.replace(/"text-align:justify;"/g, '{{"textAlign":"justify"}}');

    // Replace any \n with <Text style={{height:10px}}. we don't use margin b/c margins don't add up(i.e /n/n/n)
    htmlCopy = htmlCopy.replace(/\n/g, '<Text style={{"height":"10px"}}></Text>');

    // Replace line Breaks
    htmlCopy = htmlCopy.replace(/<br>/g, '<Text style={{"height":"3px"}}></Text>');

    // Replace &nbsp(non-breaking space)
    htmlCopy = htmlCopy.replace(/&nbsp;/g, " ");

    // Replace closing tags
    htmlCopy = htmlCopy.replace(/<\/p>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/span>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/strong>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/em>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/ins>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/del>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/sub>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/h1>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/h2>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/h3>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/h4>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/h5>/g, "</Text>");
    htmlCopy = htmlCopy.replace(/<\/h6>/g, "</Text>");

    return htmlCopy;
}
