namespace Barbina.UI.Models;

/// <summary>
/// Fonte única de configuração para as imagens estáticas do site (banners e fotos
/// que não são gerenciadas pelo painel administrativo — essas continuam vindo do
/// banco de dados via API, como o carrossel e a galeria de Ambientes).
///
/// Para trocar uma imagem, edite SOMENTE a constante correspondente abaixo.
/// Nenhuma view (.cshtml) e nenhum arquivo CSS precisa ser alterado.
///
/// As constantes aceitam tanto uma URL externa (como as atuais, do Unsplash)
/// quanto um caminho local dentro de wwwroot, por exemplo "/img/site/hero-home.jpg".
/// Para usar uma imagem própria sem alterar este arquivo, basta colocar o arquivo
/// em wwwroot/img/site/ com o mesmo nome já referenciado aqui.
/// </summary>
public static class SiteImages
{
    // ---------- Página Inicial ----------
    public const string HomeHero = "/img/banner.jpg";

    // Seção "Criações do Chef"
    public const string HomeEntradas = "https://instagram.faqa2-1.fna.fbcdn.net/v/t51.71878-15/603053986_866997029383754_467562670246589039_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=110&ig_cache_key=Mzc5MjQ5MTMzMTYwNDg3MTU2NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLnhwaWRzLjY0MC5zZHIudmlkZW9fZGVmYXVsdF9jb3Zlcl9mcmFtZS5DMyJ9&_nc_ohc=95f1xfYEfiEQ7kNvwG7_p6r&_nc_oc=AdrTH5jQv9vny9bf_mnQFFYUsV4TSgfl1G65fmotvhzPEm7SsRoiFoOM6C-jmWQbd_qBVD_NYVo4MjqO0Cncm6Re&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.faqa2-1.fna&_nc_gid=49uo1dAzwJMXo767vEtjJA&_nc_ss=7a22e&oh=00_Af_srKRFeaI0SQ_vPd4oNGfwG3zzo3Bx3a9QdOgfXs0fGg&oe=6A479AF4";
    public const string HomePratosPrincipais = "https://instagram.faqa2-1.fna.fbcdn.net/v/t51.82787-15/723085168_18130944469720065_8356544177391146179_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=102&ig_cache_key=MzkyMDM1NzgzOTAzNDAyNjQyNg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTMzNy5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=Uvv-avPzeX4Q7kNvwF38iq5&_nc_oc=AdqCEzyKwe9M6uI8MrIHub3pyyKpHD4mU80c135AzuPCLKOJ6cOMWi1ZV8ew6Os_pJqXJ6n-j7xjza4KCAvKQjSn&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.faqa2-1.fna&_nc_gid=R0z56C6VM-cTfh-A9RkSYw&_nc_ss=7a22e&oh=00_Af--18BVqDOL5COfArcUkqr_0Jid91BxKGHYJywTOe6ukA&oe=6A47820F";
    public const string HomeBebidas = "https://instagram.faqa2-1.fna.fbcdn.net/v/t51.82787-15/684803631_18128098096720065_2317324940686394748_n.webp?_nc_cat=108&ig_cache_key=MzkwNDA5MTc1MDA5NzcxNTUyNw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=zS5mrTpd4gQQ7kNvwGs-30o&_nc_oc=Adq6t0Ib6BLQ0dZklTgpkvO_Cch42huN_3ME4kSDpVXc5O_ssIfCt8nyCNUTC3z6gYtfnH3XKRzqTfyWUqnjL0ZF&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.faqa2-1.fna&_nc_gid=iG-BwQIXPk7-XUn7aG78Dg&_nc_ss=7a22e&oh=00_Af9scpMlBSZEObFc1oNGZKd2sAYe4qaFp5WJ9EliLLbDDA&oe=6A47B5D2";
    public const string HomeSobremesas = "/img/doce.png";

    // Seção "Prato de Assinatura"
    public const string HomePratoAssinatura = "https://instagram.faqa2-1.fna.fbcdn.net/v/t51.82787-15/728195945_18131896915720065_8665102370187063543_n.webp?_nc_cat=102&ig_cache_key=MzkyNjY4NzA1MTY1NTE2NzYwNg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=snXElRxSuPAQ7kNvwEHPSD_&_nc_oc=AdqMREANS5Xqp_66ccZpWMOtIlZAKx26uPxp1N152IyE3voTUxZQZQKRqDyHmk1H1mZiS_emkAUDRp3nh5qEzmYN&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.faqa2-1.fna&_nc_gid=R0z56C6VM-cTfh-A9RkSYw&_nc_ss=7a22e&oh=00_Af8HsotmicPUsJr9RY7M3wzau6Ks_VzQBRDt-duwwDVp7g&oe=6A47B272";

    // Seção "Nossa História"
    public const string HomeNossaHistoria = "/img/historia.jpg";

    // ---------- Compartilhada entre Home e Ambientes ----------
    // Seção final "cta-reserva" (mesma imagem nas duas páginas, pois usam o mesmo bloco visual)
    public const string CtaReservaFooter = "/img/footer.webp";

    // ---------- Página Cardápio ----------
    public const string CardapioHero = "/img/banner2.jpg";

    // ---------- Página Reservas ----------
    public const string ReservasHero = "/img/banner2.jpg";

    // ---------- Página Contato ----------
    public const string ContatoHero = "/img/banner2.jpg";
}
