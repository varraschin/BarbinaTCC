using System.Net;
using System.Text.Json;

namespace Barbina.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;
    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger) { _next = next; _logger = logger; }

    public async Task InvokeAsync(HttpContext context)
    {
        try { await _next(context); }
        catch (Exception ex) { _logger.LogError(ex, "Unhandled exception"); await HandleExceptionAsync(context, ex); }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var response = new ErrorResponse();
        switch (exception)
        {
            case ArgumentException ex:
                response.Message = ex.Message; response.StatusCode = 400; context.Response.StatusCode = 400; break;
            case KeyNotFoundException ex:
                response.Message = ex.Message; response.StatusCode = 404; context.Response.StatusCode = 404; break;
            case UnauthorizedAccessException ex:
                response.Message = ex.Message; response.StatusCode = 401; context.Response.StatusCode = 401; break;
            default:
                response.Message = "Ocorreu um erro interno no servidor."; response.StatusCode = 500; context.Response.StatusCode = 500; break;
        }
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}

public class ErrorResponse { public int StatusCode { get; set; } public string Message { get; set; } = string.Empty; public string Details { get; set; } = string.Empty; }
