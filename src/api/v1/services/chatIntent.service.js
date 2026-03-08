const HARD_HANDOFF_RULES = [
  {
    intent: "order_status",
    patterns: [
      /\border status\b/i,
      /\bwhere is my order\b/i,
      /\bcheck(?:ing)? (?:on )?(?:my )?order\b/i,
      /\bhelp (?:me )?(?:check|track) (?:my )?order\b/i,
      /\btrack(?:ing)? (?:my )?order\b/i,
      /\bshipment status\b/i,
      /\bdelivery status\b/i,
      /\border\b.*\b(status|tracking|delivery|shipment)\b/i,
    ],
  },
  {
    intent: "payment_issue",
    patterns: [
      /\bpayment (?:failed|error|issue|problem)\b/i,
      /\bcan(?:not|'t) pay\b/i,
      /\bcard (?:declined|error|failed)\b/i,
      /\bcharged\b/i,
      /\bdouble charge\b/i,
      /\btransaction (?:failed|error|issue)\b/i,
      /\bmomo\b/i,
      /\bpaypal\b/i,
      /\bstripe\b/i,
    ],
  },
  {
    intent: "refund",
    patterns: [
      /\brefund\b/i,
      /\bmoney back\b/i,
      /\breimbursement\b/i,
      /\bchargeback\b/i,
    ],
  },
  {
    intent: "exchange_return",
    patterns: [
      /\breturn\b/i,
      /\bexchange\b/i,
      /\bchange size\b/i,
      /\breplace(?:ment)?\b/i,
      /\bsend (?:it|this) back\b/i,
    ],
  },
  {
    intent: "complaint",
    patterns: [
      /\bcomplaint\b/i,
      /\bbad service\b/i,
      /\bterrible\b/i,
      /\bunacceptable\b/i,
      /\bwrong item\b/i,
      /\bdamaged\b/i,
      /\bbroken\b/i,
      /\bangry\b/i,
    ],
  },
];

const PRODUCT_AVAILABILITY_PATTERNS = [
  /\bin stock\b/i,
  /\bavailable\b/i,
  /\bavailability\b/i,
  /\bout of stock\b/i,
  /\bdo you have\b/i,
  /\bhave\b.*\bsize\b/i,
  /\bsize\b/i,
  /\bcolor\b/i,
  /\bcolour\b/i,
];

const PRODUCT_BASIC_ADVICE_PATTERNS = [
  /\brecommend\b/i,
  /\bsuggest\b/i,
  /\bwhich (?:one|product)\b/i,
  /\bwhat should i buy\b/i,
  /\bmaterial\b/i,
  /\bcare instructions?\b/i,
  /\bhow to style\b/i,
  /\bwhat fits\b/i,
];

const PRODUCT_SEARCH_PATTERNS = [
  /\bfind\b/i,
  /\bsearch\b/i,
  /\bshow me\b/i,
  /\blooking for\b/i,
  /\bi need\b/i,
  /\bi want\b/i,
  /\bdo you sell\b/i,
  /\bproducts?\b/i,
  /\bshirt\b/i,
  /\bt-?shirt\b/i,
  /\bdress\b/i,
  /\bjacket\b/i,
  /\bjeans\b/i,
  /\bhoodie\b/i,
  /\bshoes?\b/i,
  /\bskirt\b/i,
  /\bpants?\b/i,
];

function matchesAny(text, patterns = []) {
  return patterns.some((pattern) => pattern.test(text));
}

export class ChatIntentService {
  detectIntent(message = "") {
    const text = String(message || "").trim();
    if (!text) return null;

    for (const rule of HARD_HANDOFF_RULES) {
      if (matchesAny(text, rule.patterns)) {
        return {
          route: "hard_handoff",
          intent: rule.intent,
        };
      }
    }

    if (matchesAny(text, PRODUCT_AVAILABILITY_PATTERNS)) {
      return {
        route: "product_tool",
        intent: "product_availability",
      };
    }

    if (matchesAny(text, PRODUCT_BASIC_ADVICE_PATTERNS)) {
      return {
        route: "product_tool",
        intent: "product_basic_advice",
      };
    }

    if (matchesAny(text, PRODUCT_SEARCH_PATTERNS)) {
      return {
        route: "product_tool",
        intent: "product_search",
      };
    }

    return null;
  }

  buildAutoHandoffReason(intent) {
    const normalized = String(intent || "").trim() || "unknown";
    return `AUTO_HANDOFF:${normalized}:Customer requested ${normalized}`;
  }
}
