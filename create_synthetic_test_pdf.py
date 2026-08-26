import os

def create_synthetic_spaced_pdf(output_path: str):
    """Generate a synthetic character-spaced PDF resume for regression testing."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # We will construct a PDF stream where text lines are spaced: "A L E X   J O H N S O N"
    lines_data = [
        (16, "A L E X   J O H N S O N"),
        (10, "P u n e ,   I n d i a   |   a l e x . j o h n s o n @ e x a m p l e . c o m   |   L i n k e d I n   |   G i t H u b"),
        (13, "S U M M A R Y"),
        (10, "F i n a l - y e a r   C o m p u t e r   E n g i n e e r i n g   s t u d e n t   w i t h   e x p e r i e n c e   i n   P y t h o n ,   f u l l - s t a c k   d e v e l o p m e n t ,"),
        (10, "R E S T   A P I s ,   d a t a b a s e s ,   a n d   p r a c t i c a l   s o f t w a r e   p r o j e c t s .   S e e k i n g   s o f t w a r e   e n g i n e e r i n g   r o l e s ."),
        (13, "T E C H N I C A L   S K I L L S"),
        (10, "P r o g r a m m i n g :   P y t h o n ,   J a v a ,   J a v a S c r i p t ,   C + +"),
        (10, "W e b :   R e a c t ,   N o d e . j s ,   E x p r e s s ,   H T M L ,   C S S ,   R E S T   A P I s"),
        (10, "D a t a b a s e s :   P o s t g r e S Q L ,   M y S Q L ,   M o n g o D B ,   S Q L i t e"),
        (10, "T o o l s :   G i t ,   G i t H u b ,   D o c k e r ,   P o s t m a n ,   L i n u x"),
        (13, "E X P E R I E N C E"),
        (11, "S o f t w a r e   D e v e l o p e r   I n t e r n   -   E x a m p l e   T e c h n o l o g i e s"),
        (10, "B u i l t   R E S T   A P I s   a n d   b a c k e n d   s e r v i c e s   f o r   a n   i n t e r n a l   p r o j e c t ."),
        (10, "I m p r o v e d   d a t a - p r o c e s s i n g   w o r k f l o w   a n d   a d d e d   a u t o m a t e d   v a l i d a t i o n ."),
        (13, "P R O J E C T S"),
        (11, "R e s u m e   I n s i g h t   T o o l   -   G i t H u b"),
        (10, "D e v e l o p e d   a   w e b   a p p l i c a t i o n   t h a t   a n a l y z e s   r e s u m e s   a n d   c o m p a r e s   t h e m   w i t h   j o b   d e s c r i p t i o n s ."),
        (10, "I m p l e m e n t e d   f i l e   u p l o a d ,   t e x t   e x t r a c t i o n ,   k e y w o r d   m a t c h i n g ,   a n d   s c o r i n g   f e a t u r e s ."),
        (11, "T a s k   M a n a g e m e n t   A P I   -   G i t H u b"),
        (10, "C r e a t e d   a   P y t h o n   A P I   w i t h   a u t h e n t i c a t i o n ,   C R U D   o p e r a t i o n s ,   a n d   P o s t g r e S Q L   i n t e g r a t i o n ."),
        (13, "E D U C A T I O N"),
        (10, "B a c h e l o r   o f   E n g i n e e r i n g   i n   C o m p u t e r   E n g i n e e r i n g   -   E x a m p l e   I n s t i t u t e"),
        (10, "2 0 2 2   -   2 0 2 6   |   C G P A :   8 . 4   /   1 0"),
        (13, "C E R T I F I C A T I O N S"),
        (10, "P y t h o n   P r o g r a m m i n g   C e r t i f i c a t e   -   E x a m p l e   A c a d e m y"),
        (10, "F u l l   S t a c k   W e b   D e v e l o p m e n t   C e r t i f i c a t e   -   E x a m p l e   A c a d e m y"),
    ]

    stream_ops = ["BT\n50 760 Td\n"]
    for i, (size, text) in enumerate(lines_data):
        # Escape parenthesis
        escaped_text = text.replace("(", "\\(").replace(")", "\\)")
        if i == 0:
            stream_ops.append(f"/F1 {size} Tf\n({escaped_text}) Tj\n")
        else:
            spacing = -24 if size >= 13 else (-18 if size == 11 else -14)
            stream_ops.append(f"0 {spacing} Td\n/F1 {size} Tf\n({escaped_text}) Tj\n")
    stream_ops.append("ET\n")

    stream_content = "".join(stream_ops).encode("latin-1")
    stream_len = len(stream_content)

    pdf_body = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {stream_len} >>
stream
""".encode("latin-1") + stream_content + f"""endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
550
%%EOF
""".encode("latin-1")

    with open(output_path, "wb") as f:
        f.write(pdf_body)
    print(f"Generated synthetic character-spaced PDF: {output_path} ({len(pdf_body)} bytes)")

if __name__ == "__main__":
    create_synthetic_spaced_pdf("test_files/synthetic_spaced_text_resume.pdf")
