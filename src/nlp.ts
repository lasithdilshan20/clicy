/**
 * Natural Language Processing (NLP) utilities for Cypress commands
 */

/**
 * Parses a natural language command and converts it to a Cypress command
 * @param input The natural language input from the user
 * @returns A Cypress command string or null if no match
 */
export const parseNaturalLanguageCommand = (input: string): string | null => {
  // Just normalize whitespace and trim
  const normalizedInput = input.trim().replace(/\s+/g, ' ');

  // Click patterns
  const clickPatterns = [
    /^click (?:on )?(?:the )?(login|submit|signup|cancel|save|delete|update|edit|add|remove|search|filter|sort|print|export|import|download|upload|send|receive|open|close|show|hide|enable|disable|select|deselect|check|uncheck|toggle|expand|collapse|maximize|minimize|refresh|reload|undo|redo|cut|copy|paste|back|forward|next|previous|first|last|top|bottom|left|right|center|ok|yes|no|cancel|apply|reset|clear|done|finish|start|stop|pause|resume|play|record|capture|share|like|follow|block|report|flag|star|favorite|bookmark|pin|unpin|lock|unlock|zoom|pan|rotate|flip|crop|resize|scale|move|drag|drop|swipe|scroll|navigate|browse|view|preview|details|summary|list|grid|table|chart|graph|map|calendar|timeline|slider|progress|meter|gauge|indicator|badge|label|tag|icon|image|video|audio|file|folder|document|sheet|slide|form|input|output|field|button|link|menu|tab|panel|dialog|modal|popup|tooltip|notification|alert|warning|error|success|info|help|hint|tip|note|comment|message|chat|email|phone|address|contact|profile|account|user|group|team|organization|company|business|product|service|feature|function|option|setting|preference|configuration|setup|install|uninstall|upgrade|downgrade|update|patch|fix|bug|issue|problem|solution|answer|question|query|search|find|filter|sort|order|arrange|organize|categorize|classify|tag|label|mark|highlight|emphasize|bold|italic|underline|strikethrough|font|color|style|theme|skin|layout|design|template|pattern|background|foreground|header|footer|sidebar|main|content|section|article|post|page|site|website|app|application|program|software|hardware|device|system|platform|framework|library|module|component|element|object|class|method|function|variable|constant|parameter|argument|value|type|interface|implementation|instance|reference|pointer|memory|storage|database|table|record|row|column|cell|field|key|index|hash|array|list|stack|queue|tree|graph|node|edge|vertex|path|route|link|connection|relation|dependency|parent|child|sibling|ancestor|descendant|root|leaf|branch|trunk|core|shell|kernel|driver|plugin|extension|addon|widget|gadget|utility|tool|resource|asset|media|content|data|information|knowledge|wisdom|intelligence|learning|education|training|course|lesson|tutorial|guide|manual|documentation|specification|requirement|design|architecture|structure|pattern|algorithm|code|script|program|process|thread|task|job|service|daemon|server|client|host|guest|user|admin|owner|member|visitor|customer|partner|vendor|supplier|provider|consumer|producer|sender|receiver|source|destination|origin|target|input|output|throughput|bandwidth|speed|performance|efficiency|effectiveness|quality|quantity|size|dimension|length|width|height|depth|weight|volume|area|space|time|date|duration|period|interval|frequency|rate|ratio|proportion|percentage|fraction|decimal|integer|float|double|number|string|character|letter|digit|symbol|punctuation|whitespace|newline|tab|space|indent|margin|padding|border|outline|shadow|gradient|transparency|opacity|visibility|display|position|alignment|orientation|direction|rotation|translation|transformation|animation|transition|effect|filter|blur|sharpen|contrast|brightness|saturation|hue|color|background|foreground|font|text|paragraph|line|word|character|glyph|icon|image|picture|photo|graphic|logo|banner|header|footer|sidebar|panel|card|tile|grid|table|row|column|cell|form|input|output|field|label|button|link|menu|tab|navigation|pagination|breadcrumb|path|route|url|uri|endpoint|api|service|function|method|callback|promise|async|await|event|listener|handler|trigger|action|reaction|response|request|query|parameter|argument|option|setting|preference|configuration|state|status|condition|mode|environment|context|scope|namespace|module|package|library|framework|platform|language|syntax|grammar|vocabulary|dictionary|thesaurus|translation|localization|internationalization|accessibility|security|privacy|authentication|authorization|permission|role|user|group|team|organization|company|business|product|service|feature|function)(?:\s+button)?$/i,  // "click login button" or "click on the submit"
    /^(?:click|press|tap) (?:the )?(login|submit|signup|cancel|save|delete|update|edit|add|remove|search|filter|sort|print|export|import|download|upload|send|receive|open|close|show|hide|enable|disable|select|deselect|check|uncheck|toggle|expand|collapse|maximize|minimize|refresh|reload|undo|redo|cut|copy|paste|back|forward|next|previous|first|last|top|bottom|left|right|center|ok|yes|no|cancel|apply|reset|clear|done|finish|start|stop|pause|resume|play|record|capture|share|like|follow|block|report|flag|star|favorite|bookmark|pin|unpin|lock|unlock|zoom|pan|rotate|flip|crop|resize|scale|move|drag|drop|swipe|scroll|navigate|browse|view|preview|details|summary|list|grid|table|chart|graph|map|calendar|timeline|slider|progress|meter|gauge|indicator|badge|label|tag|icon|image|video|audio|file|folder|document|sheet|slide|form|input|output|field|button|link|menu|tab|panel|dialog|modal|popup|tooltip|notification|alert|warning|error|success|info|help|hint|tip|note|comment|message|chat|email|phone|address|contact|profile|account|user|group|team|organization|company|business|product|service|feature|function|option|setting|preference|configuration|setup|install|uninstall|upgrade|downgrade|update|patch|fix|bug|issue|problem|solution|answer|question|query|search|find|filter|sort|order|arrange|organize|categorize|classify|tag|label|mark|highlight|emphasize|bold|italic|underline|strikethrough|font|color|style|theme|skin|layout|design|template|pattern|background|foreground|header|footer|sidebar|main|content|section|article|post|page|site|website|app|application|program|software|hardware|device|system|platform|framework|library|module|component|element|object|class|method|function|variable|constant|parameter|argument|value|type|interface|implementation|instance|reference|pointer|memory|storage|database|table|record|row|column|cell|field|key|index|hash|array|list|stack|queue|tree|graph|node|edge|vertex|path|route|link|connection|relation|dependency|parent|child|sibling|ancestor|descendant|root|leaf|branch|trunk|core|shell|kernel|driver|plugin|extension|addon|widget|gadget|utility|tool|resource|asset|media|content|data|information|knowledge|wisdom|intelligence|learning|education|training|course|lesson|tutorial|guide|manual|documentation|specification|requirement|design|architecture|structure|pattern|algorithm|code|script|program|process|thread|task|job|service|daemon|server|client|host|guest|user|admin|owner|member|visitor|customer|partner|vendor|supplier|provider|consumer|producer|sender|receiver|source|destination|origin|target|input|output|throughput|bandwidth|speed|performance|efficiency|effectiveness|quality|quantity|size|dimension|length|width|height|depth|weight|volume|area|space|time|date|duration|period|interval|frequency|rate|ratio|proportion|percentage|fraction|decimal|integer|float|double|number|string|character|letter|digit|symbol|punctuation|whitespace|newline|tab|space|indent|margin|padding|border|outline|shadow|gradient|transparency|opacity|visibility|display|position|alignment|orientation|direction|rotation|translation|transformation|animation|transition|effect|filter|blur|sharpen|contrast|brightness|saturation|hue|color|background|foreground|font|text|paragraph|line|word|character|glyph|icon|image|picture|photo|graphic|logo|banner|header|footer|sidebar|panel|card|tile|grid|table|row|column|cell|form|input|output|field|label|button|link|menu|tab|navigation|pagination|breadcrumb|path|route|url|uri|endpoint|api|service|function|method|callback|promise|async|await|event|listener|handler|trigger|action|reaction|response|request|query|parameter|argument|option|setting|preference|configuration|state|status|condition|mode|environment|context|scope|namespace|module|package|library|framework|platform|language|syntax|grammar|vocabulary|dictionary|thesaurus|translation|localization|internationalization|accessibility|security|privacy|authentication|authorization|permission|role|user|group|team|organization|company|business|product|service|feature|function)$/i,          // "press the login" or "tap submit"
  ];

  for (const pattern of clickPatterns) {
    const match = normalizedInput.match(pattern);
    if (match && match[1]) {
      const element = match[1].trim();
      // If it looks like a selector (starts with # or .), use get()
      if (element.startsWith('#') || element.startsWith('.')) {
        return `cy.get("${element}").click()`;
      }
      // Otherwise use contains()
      return `cy.contains("${element}").click()`;
    }
  }

  // Type/input/write patterns
  const typePatterns = [
    /^(?:type|input|write|enter) ["'](.+?)["'] (?:in|into|to) (?:the )?(.+?)$/i,  // "type 'hello' in username field"
    /^(?:type|input|write|enter) (?:in|into|to) (?:the )?(.+?) ["'](.+?)["']$/i,  // "type in username 'hello'"
    /^(?:fill|populate) (?:the )?(.+?) (?:with|using) ["'](.+?)["']$/i,  // "fill email with 'test@example.com'"
  ];

  for (const pattern of typePatterns) {
    const match = normalizedInput.match(pattern);
    if (match) {
      let text, field;

      // Handle different pattern formats
      if (pattern.toString().includes('in|into|to') && pattern.toString().includes('field|input|box')) {
        // Pattern: "type in username 'hello'"
        field = match[1].trim();
        text = match[2].trim();
      } else if (pattern.toString().includes('with|using')) {
        // Pattern: "fill email with 'test@example.com'"
        field = match[1].trim();
        text = match[2].trim();
      } else {
        // Pattern: "type 'hello' in username field"
        text = match[1].trim();
        field = match[2].trim();
      }

      // Remove quotes if present
      text = text.replace(/^["']|["']$/g, '');

      // If field looks like a selector, use get()
      if (field.startsWith('#') || field.startsWith('.')) {
        return `cy.get("${field}").type("${text}")`;
      }
      // Otherwise use contains() with parent find
      return `cy.contains("${field}").parent().find('input').type("${text}")`;
    }
  }

  // Visit/navigate/go to URL patterns
  const visitPatterns = [
    /^(?:visit|navigate to|go to|open) (?:the )?(?:url|site|page|website)? ?["']?([^"']+?)["']?$/i,  // "visit https://example.com" or "go to example.com"
  ];

  for (const pattern of visitPatterns) {
    const match = normalizedInput.match(pattern);
    if (match && match[1]) {
      let url = match[1].trim();

      // Add https:// if no protocol specified
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      return `cy.visit("${url}")`;
    }
  }

  // Select dropdown option patterns
  const selectPatterns = [
    /^(?:select|choose) (?:the )?(?:option )?["'](.+?)["'] (?:from|in) (?:the )?(.+?)$/i,  // "select 'California' from state dropdown"
  ];

  for (const pattern of selectPatterns) {
    const match = normalizedInput.match(pattern);
    if (match && match[1] && match[2]) {
      const option = match[1].trim().replace(/^["']|["']$/g, '');
      const dropdown = match[2].trim();

      // If dropdown looks like a selector, use get()
      if (dropdown.startsWith('#') || dropdown.startsWith('.')) {
        return `cy.get("${dropdown}").select("${option}")`;
      }
      // Otherwise use contains()
      return `cy.contains("${dropdown}").parent().find('select').select("${option}")`;
    }
  }

  // Check/uncheck checkbox patterns
  const checkboxPatterns = [
    /^(?:check|tick|select) (?:the )?(.+?)$/i,  // "check terms checkbox"
    /^(?:uncheck|untick|deselect) (?:the )?(.+?)$/i,  // "uncheck newsletter"
  ];

  for (const pattern of checkboxPatterns) {
    const match = normalizedInput.match(pattern);
    if (match && match[1]) {
      const checkbox = match[1].trim();
      const action = normalizedInput.startsWith('un') ? 'uncheck' : 'check';

      // If checkbox looks like a selector, use get()
      if (checkbox.startsWith('#') || checkbox.startsWith('.')) {
        return `cy.get("${checkbox}").${action}()`;
      }
      // Otherwise use contains()
      return `cy.contains("${checkbox}").parent().find('input[type="checkbox"]').${action}()`;
    }
  }

  // Wait patterns
  const waitPatterns = [
    /^(?:wait|pause) (?:for )?(\d+) (?:second|seconds|ms|milliseconds)$/i,  // "wait 2 seconds"
  ];

  for (const pattern of waitPatterns) {
    const match = normalizedInput.match(pattern);
    if (match && match[1]) {
      let time = parseInt(match[1], 10);

      // Convert to milliseconds if specified in seconds
      if (normalizedInput.includes('second')) {
        time *= 1000;
      }

      return `cy.wait(${time})`;
    }
  }

  // Find/get element patterns
  const findPatterns = [
    /^(?:find|get|locate) (?:the )?(.+?)$/i,  // "find login button"
  ];

  for (const pattern of findPatterns) {
    const match = normalizedInput.match(pattern);
    if (match && match[1]) {
      const element = match[1].trim();

      // If element looks like a selector, use get()
      if (element.startsWith('#') || element.startsWith('.')) {
        return `cy.get("${element}")`;
      }
      // Otherwise use contains()
      return `cy.contains("${element}")`;
    }
  }

  // No match found
  return null;
};
