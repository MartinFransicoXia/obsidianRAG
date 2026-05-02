import { QueryType } from "../types";

/**
 * Query analyzer - determines query type for adaptive weighting
 */
export class QueryAnalyzer {
  // Chinese patterns
  private patterns = {
    definition: [
      /什么是/,
      /什么叫/,
      /定义/,
      /含义/,
      /意思/,
      /概念/,
      /是什么/,
      /怎样理解/
    ],
    procedure: [
      /怎么/,
      /如何/,
      /步骤/,
      /方法/,
      /做法/,
      /流程/,
      /过程/,
      /教程/
    ],
    comparison: [
      /区别/,
      /不同/,
      /比较/,
      /对比/,
      /差异/,
      /vs/i,
      /versus/i,
      /哪个[好坏快慢]/
    ],
    explanation: [
      /为什么/,
      /原因/,
      /解释/,
      /说明/,
      /原理/,
      /机制/
    ],
    summarization: [
      /总结/,
      /概述/,
      /概要/,
      /综述/,
      /简述/,
      /概括/
    ],
    reference: [
      /公式/,
      /数据/,
      /参数/,
      /参考/,
      /查询/,
      /值是多少/,
      /多少/
    ],
    troubleshooting: [
      /报错/,
      /出错/,
      /error/i,
      /失败/,
      /问题排查/,
      /排查/,
      /故障/,
      /bug/i
    ]
  };

  /**
   * Detect query type from query text
   */
  detect(query: string): QueryType {
    const scores: Record<QueryType, number> = {
      [QueryType.DEFINITION]: 0,
      [QueryType.PROCEDURE]: 0,
      [QueryType.COMPARISON]: 0,
      [QueryType.EXPLANATION]: 0,
      [QueryType.SUMMARIZATION]: 0,
      [QueryType.REFERENCE]: 0,
      [QueryType.TROUBLESHOOTING]: 0,
    };

    // Score each pattern
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[type as QueryType] += 1;
        }
      }
    }

    // Find the type with highest score
    let maxScore = 0;
    let detectedType = QueryType.EXPLANATION;

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as QueryType;
      }
    }

    return detectedType;
  }
}
