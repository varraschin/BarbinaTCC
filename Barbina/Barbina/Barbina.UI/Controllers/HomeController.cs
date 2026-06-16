using Microsoft.AspNetCore.Mvc;

namespace Barbina.UI.Controllers;

public class HomeController : Controller
{
    public IActionResult Index() => View();
    public IActionResult Cardapio() => View();
    public IActionResult Ambientes() => View();
    public IActionResult Reservas() => View();
    public IActionResult Contato() => View();

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View(new Models.ErrorViewModel
    {
        RequestId = System.Diagnostics.Activity.Current?.Id ?? HttpContext.TraceIdentifier
    });
}
