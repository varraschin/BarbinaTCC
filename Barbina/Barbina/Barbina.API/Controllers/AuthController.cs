using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Barbina.API.DTOs;
using Barbina.API.Services.Interfaces;

namespace Barbina.API.Controllers;

[ApiController][Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) { _authService = authService; }

    [HttpPost("register")][Consumes("multipart/form-data")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromForm] RegisterDto registerDto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await _authService.RegisterAsync(registerDto));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await _authService.LoginAsync(loginDto));
    }

    [HttpGet("me")][Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        return Ok(await _authService.GetUserByIdAsync(userId));
    }

    [HttpGet("validate")][Authorize]
    public ActionResult ValidateToken() => Ok(new { message = "Token válido", isValid = true });
}
