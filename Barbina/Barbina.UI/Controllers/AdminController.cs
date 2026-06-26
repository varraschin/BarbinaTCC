using Microsoft.AspNetCore.Mvc;

namespace Barbina.UI.Controllers;

[Route("admin")]
public class AdminController : Controller
{
    [HttpGet("")]
    [HttpGet("index")]
    public IActionResult Index()
    {
        return View();
    }
}
