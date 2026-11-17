---
pubDatetime: 2026-11-17T06:05:00.000Z
title: 长任务 Harness：如何在中断后继续，而不是从头再来
featured: false
draft: false
tags:
  - Agent
  - Harness
description: 用检查点、任务清单和操作记录组织长时间运行的 Agent，重点讨论外部副作用、恢复校验与重试边界。
---

一个代码 Agent 写到一半时进程退出，重新启动后最危险的情况，并非它完全忘记了任务，而是它以为自己记得：摘要说测试通过，工作目录里却还有未经验证的补丁；日志说已经提交，远端请求却没有留下确认信息。

恢复任务必须同时回答两个问题：我们最后确认到了哪里，以及真实环境现在是什么状态。

## 将交接信息变成可验证的记录

[Anthropic 的长任务 Harness 文章](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents)讨论了初始化与增量工作之间的交接。本文借用这个问题背景，下面的检查点结构是一种独立的设计示例，并非对其实现的复刻。

对于一个仓库修改任务，可以把检查点写成：

```json
{
  "schema_version": 1,
  "task_id": "fix-date-parser",
  "base_commit": "<完整提交哈希>",
  "phase": "verifying",
  "completed": ["新增非法日期用例", "修改解析函数"],
  "pending": ["运行完整测试集"],
  "evidence": {
    "command": "python -m unittest",
    "exit_code": null
  }
}
```

`exit_code: null` 表示尚无确认结果。文件存在、命令已经发起、命令成功结束，是三件不同的事。只记录“正在测试”，无法判断恢复时是否需要重跑。

## 检查点需要怎样写入

下面的 Python 示例可以独立运行，用临时文件与替换操作降低目标文件被写到一半的风险：

```python
import json
import os
import tempfile
from pathlib import Path


def save_checkpoint(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".checkpoint-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(state, stream, ensure_ascii=False)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


if __name__ == "__main__":
    save_checkpoint(Path("checkpoint.json"), {"phase": "verifying"})
```

临时文件放在目标目录，是为了避免跨文件系统替换。这个示例没有实现多写者协调，也没有对突然断电后的目录项持久化作完整保证。多工作进程还需要锁或版本条件写入；高可靠部署还应结合文件系统语义设计持久化方案。

## 最难恢复的是外部副作用

假设 Agent 调用了创建工单接口，服务端创建成功，但响应在网络中丢失。此时客户端看到超时，如果直接重试，可能创建第二张工单。

一种处理方式是先生成并保存操作标识，再发请求；服务端以这个标识去重。恢复时先查询已有操作结果，而不是再次执行。这个方案依赖服务端真正支持持久去重，客户端自己保存一个字符串并不能提供同样的保证。

如果接口既不支持幂等键，也无法查询结果，那么“请求已发出但结果未知”应成为显式状态。需要人工核实的情况，就交代核实条件。不能把未知偷偷转换成成功，也不能用无限重试掩盖它。

## 恢复顺序比恢复提示词更重要

重新启动时，我会按以下顺序组织流程：

1. 校验检查点版本、任务标识与允许使用的目录。
2. 读取当前提交、工作区差异和最近一次验证产物。
3. 检查外部操作是否处于结果未知状态。
4. 重新确认下一项未完成工作，再恢复模型循环。

摘要是导航信息，代码、测试结果和外部系统回执才是可以核实的状态。检查点里的结论与真实环境不符时，需要更新结论，不能让模型为了保持叙事一致而忽略变化。

## 用中断实验验证恢复能力

不要只测正常退出。可以在“补丁写入后、检查点更新前”和“外部请求完成后、回执保存前”分别模拟中断。恢复后检查有没有重复操作、遗漏验证或错误宣告完成。

对于一次性的小脚本，记录最后输出或许足够。对于会修改远端资源的长任务，恢复协议是业务正确性的一部分，应该先于长时间无人值守运行设计。
