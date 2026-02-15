#!/usr/bin/env python3
"""Simple MCP server for testing HTTP transport"""

import json
from fastmcp import FastMCP

mcp = FastMCP("TestServer")


@mcp.tool()
def echo(message: str) -> str:
    """Echo back the message"""
    return f"Echo: {message}"


@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b


if __name__ == "__main__":
    import uvicorn

    mcp.run(transport="streamable-http", host="127.0.0.1", port=8000)
