---
pubDatetime: 2026-11-17T06:15:00.000Z
title: Agent 工具契约：参数合法之后，还要检查什么
featured: false
draft: false
tags:
  - Agent
  - Harness
description: 从读取仓库文件的工具出发，拆解输入校验、权限范围、结构化错误和副作用控制，明确协议与执行策略的边界。
---

给 Agent 接入工具时，最先写出来的往往是函数名、描述和参数 Schema。但一次调用通过了参数校验，只能说明参数具有预期的结构，不能说明它符合用户授权，也不能说明执行结果可以直接相信。

一个实用的工具契约，需要同时说明输入是什么、允许做什么，以及结果如何被下一轮消费。

## 协议没有替应用决定所有策略

以 [MCP 的 2025-06-18 工具规范](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)为例，工具通过名称和输入 Schema 描述可调用能力，执行结果可以包含内容与错误标记。这里明确使用这一版规范作为讨论基础，不假定所有客户端都支持后续版本的全部能力。

协议解决了表达与互通的一部分问题。具体的目录白名单、业务权限、超时与重试策略，仍需要应用实现。工具名称叫 `safe_read_file`，并不会自动使文件访问安全。

## 先缩小接口的表达范围

如果任务只需要读取仓库文本，提供 `read_repository_text(path)` 通常比提供任意 shell 命令更容易约束。前者可以限制路径、大小与编码；后者必须考虑命令组合、进程行为和环境继承。

例如，可以把接口定义为以下结构。它只是应用层契约示意，没有展示 MCP 的完整消息封装：

```json
{
  "name": "read_repository_text",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {"type": "string", "minLength": 1}
    },
    "required": ["path"],
    "additionalProperties": false
  }
}
```

Schema 可以拒绝多余字段，却不会阻止 `../../private.txt`。目录范围属于执行器需要检查的条件。

## 一个只读工具的最小边界

下面是可以独立调用的 Python 函数，假设仓库不会被恶意进程并发修改：

```python
from pathlib import Path


class ToolError(Exception):
    pass


def read_repository_text(root: Path, relative: str) -> str:
    if not relative or Path(relative).is_absolute():
        raise ToolError("expected_relative_path")

    root = root.resolve(strict=True)
    target = (root / relative).resolve(strict=True)
    if not target.is_relative_to(root):
        raise ToolError("path_outside_repository")
    if not target.is_file():
        raise ToolError("expected_regular_file")

    with target.open("rb") as stream:
        data = stream.read(64 * 1024 + 1)
    if len(data) > 64 * 1024:
        raise ToolError("file_too_large")
    return data.decode("utf-8")
```

解析后的包含关系检查可以处理常见的路径穿越和指向仓库外的符号链接。它不能消除检查与打开之间的竞态；如果不可信进程能同时替换路径，需要依赖更严格的文件描述符操作或沙箱隔离。实际服务也应把文件不存在、无权限和解码失败转换成稳定的错误类型，避免将内部异常栈直接暴露给模型。

此外，“位于仓库内”并不意味着“允许读取”。仓库可能含有密钥和个人文件，还需要任务级允许列表与敏感文件规则。工具能力应当与用户授权的范围一起决定。

## 错误要帮助模型选择下一步

同一个“调用失败”可能对应完全不同的处理方式：参数错误应该修正输入；权限不足应该停止或请求授权；服务短暂不可用可以考虑重试；外部写入结果未知则需要先核实。

可以返回应用层错误对象，包含稳定的 `code`、可读说明和执行器给出的恢复建议。不要让模型仅凭自然语言猜测副作用是否已经发生，也不要把服务端返回的“可重试”当成无条件重复写入的依据。

## 工具契约需要反向检查

除了正常读取一个文件，还应检查绝对路径、越界路径、越界符号链接、目录输入、超大文件和非 UTF-8 文件。对于写入工具，再增加重复请求与响应丢失场景。

接口描述负责让模型容易用对，执行器负责让错误用法受到约束。两者都做到了，工具才适合被放进自动循环。
