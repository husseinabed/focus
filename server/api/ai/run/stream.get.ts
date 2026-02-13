// ~/server/api/ai//stream.get.ts
import { stream } from "~~/server/utils/stream";
import { getRun, deleteRun, cleanupRuns } from "~~/server/state/runs";
import { getProjectDataByKey, setProjectDataByKey } from "~~/server/utils/projectsStore";
import { streamDeploymentEvents } from "~~/server/ai/utils/streamDeploymentEvents";
import { researchAgent } from "~~/server/ai/agent/research";
import { strategyResearchAgent } from "~~/server/ai/agent/strategy";
import { brandStrategyAgent } from "~~/server/ai/agent/brand_strategy";
import { brandAgent } from "~~/server/ai/agent/brand";
import { UXAgent } from "~~/server/ai/agent/ux";
import { UIAgent } from "~~/server/ai/agent/ui";
import { getPlannerAgent } from "~~/server/ai/agent/planner";
import { getApplyAgent } from "~~/server/ai/agent/apply";
import { copywriteAgent } from "~~/server/ai/agent/copywrite";
import { designAgent } from "~~/server/ai/agent/design";
import { getDevAgent } from "~~/server/ai/agent/dev";
import { getDebugAgent } from "~~/server/ai/agent/debug";




export default defineEventHandler((event) =>
  stream(event, async ({ send }) => {
    // const { runId, type, lang } = getQuery(event);
    // const output_language = lang as string || "en-USA";

    // if (!runId || typeof runId !== "string") {
    //   send({ type: "error", message: "missing runId" });
    //   return;
    // }

    // const run = getRun(runId);

    // if (!run) {
    //   send({ type: "error", message: "run not found" });
    //   deleteRun(runId);
    //   return;
    // }

    // if (!type) {
    //   send({ type: "error", message: "type not found" });
    //   deleteRun(runId);
    //   return;
    // }
    const strategy = {
      "meta": {
        "schema_version": "1.0.0",
        "confidence": "high",
        "assumptions": [
          "The primary audience consists of Israeli SMB owners who may be tech-skeptical but results-oriented.",
          "WhatsApp is the preferred communication channel over email or traditional forms in the Israeli market.",
          "The multilingual requirement (HE/AR) is a competitive differentiator for serving diverse local populations."
        ],
        "constraints": [
          "Must adhere to RTL (Right-to-Left) design standards for both Hebrew and Arabic.",
          "Focus is strictly on speed to lead and WhatsApp conversion."
        ]
      },
      "input_understanding": {
        "business_context": "Focus AI is a specialized agency leveraging AI to provide Israeli SMBs with high-conversion, multilingual websites. Unlike general builders like Wix, Focus AI emphasizes a 'WhatsApp-first' philosophy to minimize friction in the Israeli sales cycle.",
        "icp": "Israeli SMB owners (Home services, clinics, local consultants, retail) who need a digital presence that actually drives phone-based conversations.",
        "market_nuance": "Israeli culture values directness (Dugri) and speed. A long form is a conversion killer; a direct WhatsApp link is the local standard for trust and immediate gratification.",
        "languages": [
          "Hebrew (Primary)",
          "Arabic (Secondary/Targeted)"
        ]
      },
      "research": {
        "market_benchmarks": [
          {
            "title": "Israel: WhatsApp as the leading social platform",
            "publisher": "Statista",
            "date": "2023",
            "summary": "WhatsApp remains the most used messaging app in Israel with over 90% penetration among smartphone users, making it the primary business-to-consumer communication tool.",
            "url": "https://www.statista.com/statistics/1291341/israel-most-popular-social-networks/"
          },
          {
            "title": "Bidirectional (RTL) Design Guidelines",
            "publisher": "Google Material Design",
            "summary": "RTL layouts require mirroring not just text, but icons that imply direction (arrows, progress bars) and the hierarchy of information to ensure cognitive ease for Hebrew and Arabic speakers.",
            "url": "https://m2.material.io/design/usability/bidirectionality.html"
          },
          {
            "title": "The Need for Speed to Lead",
            "publisher": "Harvard Business Review",
            "summary": "Companies that attempt to contact potential leads within an hour are 7x more likely to have meaningful conversations. WhatsApp allows for near-instant response, fitting this benchmark perfectly.",
            "url": "https://hbr.org/2011/03/the-short-life-of-online-leads"
          }
        ],
        "competitor_patterns": {
          "wix_israel": "Offers generic templates but lacks 'deep' conversion optimization for the local WhatsApp-first workflow.",
          "local_agencies": "Often focus on high-end branding or SEO, leaving a gap for fast, AI-driven, lead-focused landing pages for smaller budgets."
        },
        "messaging_trends": [
          "Move away from 'AI' as a buzzword toward 'AI as an efficiency tool' (e.g., 'An AI that builds your sales team, not just a site').",
          "Heavy use of social proof and video testimonials in the Israeli market to build trust quickly."
        ]
      },
      "strategy_root": {
        "positioning": "The 'WhatsApp-First' Web Agency for Israeli Growth.",
        "value_proposition": "We build AI-powered websites that don't just sit there—they start conversations on WhatsApp. Multilingual, RTL-ready, and optimized for the Israeli pace of business.",
        "offer_ladder": [
          {
            "tier": "Lead-Gen Landing Page",
            "focus": "Single product/service with 1-click WhatsApp conversion."
          },
          {
            "tier": "Full Multilingual Site (HE/AR/EN)",
            "focus": "Scaling reach to all Israeli demographics with AI-translated, culturally nuanced content."
          },
          {
            "tier": "Focus AI Managed",
            "focus": "Ongoing optimization, review management, and lead tracking."
          }
        ],
        "funnel_map": "Ad/Search -> Multilingual Landing Page -> WhatsApp Click -> Automated Welcome Message -> Human Sales Closing."
      },
      "brand_foundation": {
        "brand_pillars": [
          "Speed",
          "Directness (Dugri)",
          "Technological Edge",
          "Local Accessibility"
        ],
        "visual_direction": {
          "palette": "Professional Blue (Trust), Energetic Green (WhatsApp association), and Clean White (Clarity).",
          "typography": "Modern Hebrew/Arabic sans-serifs: Assistant (Hebrew) and Cairo (Arabic) for high readability.",
          "ux_principles": "RTL-native hierarchy, thumb-friendly mobile design, 'No-Friction' CTA buttons."
        }
      },
      "website_blueprint": {
        "page_ia": [
          {
            "page": "Home / Landing Page",
            "sections": [
              {
                "name": "Hero",
                "purpose": "Instant clarity on the value prop.",
                "message": "אתר שבונה לך לידים בוואטסאפ (A site that builds you leads on WhatsApp).",
                "cta": "בואו נדבר בוואטסאפ",
                "trust_element": "No-cure no-pay or speed guarantee."
              },
              {
                "name": "The Problem",
                "purpose": "Agitate the friction of old sites.",
                "message": "Forms are dead. People want to chat now.",
                "cta": "See how it works",
                "trust_element": "Stats on form abandonment vs. chat engagement."
              },
              {
                "name": "Multilingual Advantage",
                "purpose": "Showcase the HE/AR/EN capability.",
                "message": "Reach every customer in Israel in their own language.",
                "cta": "Explore language options",
                "trust_element": "Flags/Icons of HE, AR, EN."
              },
              {
                "name": "Social Proof",
                "purpose": "Build local trust.",
                "message": "What Israeli SMBs are saying.",
                "cta": "Read more reviews",
                "trust_element": "Google Reviews widget (Secondary Goal)."
              }
            ]
          }
        ]
      },
      "copy_framework": {
        "voice_and_tone": "Authoritative but accessible, fast-paced, and results-driven.",
        "headline_formulas": [
          "יותר לידים, פחות דיבורים: האתר שעובד בשבילך בוואטסאפ",
          "Focus AI: האתר המהיר ביותר בישראל לחיבור עם לקוחות"
        ],
        "conversion_hooks": [
          "Check out within 30 seconds via WhatsApp.",
          "Get a personalized quote in your language instantly."
        ]
      },
      "experiments_and_metrics": {
        "north_star_metric": "WhatsApp Conversion Rate (Clicks to WhatsApp / Total Visitors)",
        "secondary_metrics": [
          "Review Submission Rate",
          "Multilingual Toggle Usage"
        ],
        "experiment_backlog": [
          {
            "hypothesis": "Changing the WhatsApp CTA from 'Contact Us' to 'Start a Chat in Hebrew' will increase clicks by 15%.",
            "metric": "CTR"
          },
          {
            "hypothesis": "Adding a floating 'Reviews' badge will increase trust signals and lead to higher conversion on the WhatsApp button.",
            "metric": "Conversion Rate"
          }
        ]
      },
      "deliverables": [
        "Multilingual Content Strategy (HE/AR)",
        "RTL-Optimized UI Design System",
        "WhatsApp Lead Tracking Integration",
        "Automated Review Collection Funnel"
      ]
    }

    const brand_system = {
      "meta": {
        "schema_version": "1.0.0",
        "confidence": "high",
        "assumptions": [
          "The brand must feel 'Local' (Israeli) rather than 'Global Corporate' to build trust with SMBs.",
          "The 'AI' aspect should be framed as a performance engine, not a technical gimmick.",
          "RTL is the primary design priority, not an afterthought."
        ],
        "constraints": [
          "Must use WhatsApp Green as a secondary or accent color to trigger the Pavlovian response of 'instant chat'.",
          "Typography must be highly legible for older SMB owners on mobile devices."
        ]
      },
      "brand_strategy": {
        "positioning_statement": "Focus AI is the performance-driven web partner for Israeli SMBs, replacing outdated forms with AI-powered, multilingual sites that turn traffic into instant WhatsApp conversations.",
        "category": "High-Conversion AI Web Agency",
        "target_audience": "Israeli SMB owners (clinics, home services, local retail) seeking growth without technical complexity.",
        "primary_problem": "Traditional websites are 'lead graveyards' where forms go unanswered and potential customers lose interest.",
        "brand_promise": "We build the fastest bridge between a local customer's need and your WhatsApp inbox.",
        "reasons_to_believe": [
          "Native RTL-first architecture for Hebrew and Arabic.",
          "AI-optimized copy designed for the 'Dugri' Israeli mindset.",
          "Proven 'Speed to Lead' framework using WhatsApp integration.",
          "Done-for-you multilingual scaling."
        ],
        "differentiators": [
          "WhatsApp-First UX (Not just a button, but a funnel).",
          "Cross-sector Israeli demographic reach (HE/AR).",
          "AI-speed delivery with boutique-level conversion strategy."
        ],
        "objection_handling": [
          {
            "objection": "I already have a Wix site; why change?",
            "answer": "Wix is a digital business card; Focus AI is a sales closer. We focus on the 3 seconds after someone lands to ensure they click WhatsApp.",
            "proof_assets": [
              "Conversion comparison stats",
              "Local case studies"
            ]
          },
          {
            "objection": "Is AI content good enough for my professional reputation?",
            "answer": "We use AI for the heavy lifting, but our local strategists refine the 'Dugri' tone to ensure it sounds like a human expert.",
            "proof_assets": [
              "Before/After copy samples"
            ]
          }
        ],
        "brand_pillars": [
          {
            "pillar": "Directness (Dugri)",
            "meaning": "No fluff, no marketing jargon—just the bottom line.",
            "website_manifestations": [
              "Short, punchy headlines",
              "Transparent pricing",
              "Clear 'Start Chat' CTAs"
            ]
          },
          {
            "pillar": "Hyper-Local Accessibility",
            "meaning": "Speaking to every Israeli in their native tongue and cultural context.",
            "website_manifestations": [
              "Seamless HE/AR toggles",
              "Culturally relevant imagery",
              "RTL-perfect layouts"
            ]
          },
          {
            "pillar": "Momentum",
            "meaning": "Eliminating the 'wait time' in business.",
            "website_manifestations": [
              "Instant WhatsApp triggers",
              "Fast-loading mobile pages",
              "Rapid project turnaround"
            ]
          }
        ],
        "narrative_arc": {
          "before": "Your business is invisible or buried behind a 'Contact Us' form that no one fills out.",
          "after": "Your phone buzzes with new WhatsApp leads from customers who found you and trusted you instantly.",
          "bridge": "Focus AI: The AI-powered engine that builds your multilingual sales front in days."
        }
      },
      "brand_identity": {
        "personality_sliders": {
          "modern_classic": 80,
          "bold_calm": 70,
          "playful_serious": 20,
          "luxury_accessible": 85
        },
        "visual_principles": [
          "RTL-native hierarchy (Right-to-Left as default)",
          "Thumb-zone optimization for mobile",
          "High-contrast CTA buttons",
          "Generous white space to reduce cognitive load"
        ],
        "logo_guidance": {
          "type_direction": "Strong, geometric sans-serif wordmark with a 'Focus' bracket or lens element.",
          "do": [
            "Use a typeface that looks equally strong in Hebrew and English",
            "Ensure the symbol works as a small WhatsApp profile icon"
          ],
          "avoid": [
            "Script or handwritten fonts",
            "Generic 'robot' or 'brain' AI icons"
          ]
        },
        "imagery_direction": {
          "style": "Authentic, high-key photography of Israeli business environments.",
          "subjects": [
            "Local business owners in their natural workspace",
            "Close-ups of high-quality tools or service delivery",
            "Diverse Israeli customers interacting with mobile devices"
          ],
          "avoid": [
            "Generic American stock photos",
            "Empty office buildings",
            "Overly 'techy' blue holographic overlays"
          ],
          "usage_rules": [
            "One 'Hero' image per section",
            "Images must be mirrored for RTL layouts where directionality matters"
          ]
        },
        "iconography": {
          "style": "Modern, thick-line icons with slightly rounded corners.",
          "stroke": "2px",
          "corner_radius": "4px",
          "do": [
            "Mirror icons that imply movement (arrows, cars, progress)",
            "Use specific icons for WhatsApp, lead-gen, and translation"
          ],
          "avoid": [
            "Thin, fragile lines",
            "Complex 3D icons"
          ]
        }
      },
      "voice_and_language": {
        "global_voice_rules": [
          "Result-first (Start with the benefit)",
          "Active voice only",
          "Eliminate unnecessary adjectives",
          "Build trust through directness"
        ],
        "tone_by_stage": [
          {
            "stage": "awareness",
            "tone": "Challenging but helpful",
            "copy_rules": [
              "Focus on the 'Dead Form' problem"
            ]
          },
          {
            "stage": "conversion",
            "tone": "Direct and urgent",
            "copy_rules": [
              "Emphasize 'Start Chatting Now'"
            ]
          }
        ],
        "locale_rules": {
          "en": {
            "tone": "Professional, efficient, and innovative.",
            "dos": [
              "Use 'Launch' and 'Convert'",
              "Focus on ROI"
            ],
            "donts": [
              "Flowery language",
              "Over-explaining the AI"
            ]
          },
          "he": {
            "tone": "דוגרי, ענייני, ומכוון תוצאות (Direct, matter-of-fact, results-oriented).",
            "dos": [
              "Focus on 'Leads' (לידים)",
              "Use short, powerful verbs"
            ],
            "donts": [
              "Formal language that feels 'stiff' or 'detached'"
            ]
          },
          "ar": {
            "tone": "محترف، موثوق، ومباشر (Professional, reliable, and direct).",
            "dos": [
              "Focus on 'Growth' and 'Reach'",
              "Respectful professional address"
            ],
            "donts": [
              "Slang",
              "Overly aggressive sales tactics"
            ]
          }
        },
        "cta_library": {
          "primary": {
            "en": "Start WhatsApp Chat",
            "he": "בואו נדבר בוואטסאפ",
            "ar": "لنبدأ الدردشة عبر واتساب"
          },
          "secondary": {
            "en": "See My New Site",
            "he": "אני רוצה אתר כזה",
            "ar": "أريد موقعاً كهذا"
          },
          "microcopy": {
            "form_privacy": {
              "en": "Your number is used only to start the chat.",
              "he": "המספר שלך משמש רק לתחילת השיחה.",
              "ar": "يتم استخدام رقمك فقط لبدء الدردشة."
            },
            "response_time": {
              "en": "I'm online and ready to chat.",
              "he": "אני זמין עכשיו לשיחה.",
              "ar": "أنا متاح الآن للدردشة."
            }
          }
        }
      },
      "website_design_direction": {
        "north_star_action": "WhatsApp Conversation Start",
        "information_hierarchy": [
          "The 'Big' Promise (Leads via WhatsApp)",
          "Visual Social Proof (Local Logos/Reviews)",
          "The Pain of Current Sites (Forms = Friction)",
          "The Solution (AI Multilingual System)",
          "The Process (3 Steps to Launch)",
          "The Offer (Offer Ladder)",
          "FAQ (Objection Handling)"
        ],
        "layout_rules": [
          "Strict RTL mirroring for Hebrew/Arabic",
          "Sticky 'Start Chat' button on mobile bottom-right",
          "No more than 2 sentences per paragraph",
          "Hero section must contain social proof (stars or client count)"
        ],
        "trust_system": {
          "proof_types": [
            "WhatsApp chat screenshots (anonymized)",
            "Google Business Rating widget",
            "Before/After speed-to-lead metrics",
            "Local business logos"
          ],
          "placement_rules": [
            "Proof immediately under the hero headline",
            "Testimonials between every 2 major sections"
          ],
          "minimum_proof_per_page": 4
        },
        "component_guidelines": {
          "buttons": [
            "Primary: #25D366 with white text + WhatsApp icon",
            "Secondary: Ghost buttons with #004AAD border"
          ],
          "forms": [
            "Max 1 field if necessary (Name/Phone), but prioritize direct link"
          ],
          "pricing": [
            "Comparative table highlighting 'Full Multilingual' as best value",
            "Clear 'No Hidden Fees' microcopy"
          ],
          "testimonials": [
            "Include owner photo, business name, and 'Monthly Leads Increased by X'"
          ],
          "faq": [
            "Directly address 'How do I manage the site?' and 'Is it hard to use?'"
          ]
        },
        "rtl_guidelines": [
          "Ensure horizontal scroll direction is flipped",
          "Check font-weight for Arabic (Cairo needs more weight than Assistant)",
          "Align bullets to the right",
          "Ensure form label positioning is top-right"
        ]
      },
      "brand_to_website_mapping": [
        {
          "brand_pillar": "Speed",
          "site_sections": [
            "Hero",
            "Process"
          ],
          "ui_patterns": [
            "Progress bars",
            "Fast-loading skeletons"
          ],
          "copy_patterns": [
            "Launched in 7 days",
            "Instant leads"
          ],
          "proof_assets": [
            "Speed test results"
          ]
        },
        {
          "brand_pillar": "Local Accessibility",
          "site_sections": [
            "Language Toggle",
            "Features"
          ],
          "ui_patterns": [
            "Language flags with native labels",
            "RTL-native grid"
          ],
          "copy_patterns": [
            "Reach everyone in Israel",
            "Native Hebrew and Arabic"
          ],
          "proof_assets": [
            "Multilingual site demos"
          ]
        }
      ],
      "implementation_tokens": {
        "colors": {
          "brand": {
            "primary": "#004AAD",
            "secondary": "#002B5B",
            "accent": "#25D366"
          },
          "semantic": {
            "success": "#22C55E",
            "warning": "#F59E0B",
            "danger": "#EF4444",
            "info": "#3B82F6"
          },
          "neutrals": {
            "bg": "#FFFFFF",
            "surface": "#F8FAFC",
            "text": "#0F172A",
            "muted": "#64748B",
            "border": "#E2E8F0"
          }
        },
        "typography": {
          "font_families": {
            "en": "Inter",
            "he": "Assistant",
            "ar": "Cairo"
          },
          "scale": {
            "h1": "42px/50px",
            "h2": "32px/40px",
            "h3": "24px/30px",
            "body": "18px/28px",
            "small": "14px/20px"
          },
          "rules": [
            "Heading weight: 700",
            "Body weight: 400",
            "Hebrew text-shadow for better contrast on white"
          ]
        },
        "spacing": {
          "base_unit": 8,
          "radii": [
            "4px",
            "8px",
            "20px"
          ],
          "shadows": [
            "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            "0 10px 15px -3px rgb(0 0 0 / 0.1)"
          ]
        },
        "motion": {
          "durations": [
            "150ms",
            "300ms"
          ],
          "easing": [
            "cubic-bezier(0.4, 0, 0.2, 1)"
          ],
          "rules": [
            "Only animate entry from the right for RTL users"
          ]
        }
      },
      "handoff_checklist": {
        "assets_needed": [
          "Vector logo (Light/Dark)",
          "3 High-quality 'Israeli Context' lifestyle photos",
          "Custom icon set for 'WhatsApp', 'AI', 'Language'",
          "Google Review screenshots"
        ],
        "copy_needed": [
          "Headline A/B variants in HE/AR",
          "3 Local client testimonials",
          "FAQ list of 8 common objections",
          "Automated WhatsApp welcome message text"
        ],
        "pages_to_build": [
          "Main Multilingual Landing Page",
          "Success Page (Post-WhatsApp click)",
          "Case Study Detail Template"
        ],
        "analytics_events": [
          "whatsapp_click_hero",
          "whatsapp_click_sticky",
          "language_switch_usage",
          "pricing_table_scroll_depth"
        ],
        "a_b_tests_first_week": [
          "Headline: 'More Leads' vs 'WhatsApp-First'",
          "Sticky CTA: Always visible vs Visible on scroll",
          "Social proof: Numbers vs Logos"
        ]
      }
    }

    const design_system = {
      "meta": {
        "schema_version": "1.0.0",
        "confidence": "high"
      },
      "ux_architecture": {
        "navigation_structure": [
          {
            "label": "How It Works",
            "type": "secondary",
            "goal": "Explain the 3-step AI process to reduce tech skepticism"
          },
          {
            "label": "Case Studies",
            "type": "secondary",
            "goal": "Build authority through local success stories"
          },
          {
            "label": "Pricing",
            "type": "secondary",
            "goal": "Provide transparency (Dugri)"
          },
          {
            "label": "Start WhatsApp Chat",
            "type": "cta",
            "goal": "Direct conversion to North Star action"
          }
        ],
        "information_hierarchy": [
          "Immediate Value Prop: Leads via WhatsApp",
          "Instant Trust: Social proof immediately under Hero",
          "The Agitation: Why current sites fail (Form friction)",
          "The Solution: AI-powered, multilingual sales engine",
          "Process: Fast deployment (Momentum)",
          "Social Proof: Deep dive into local reviews",
          "Pricing: Clear offer ladder",
          "Objection Handling: FAQ for skeptical owners"
        ],
        "trust_distribution_model": {
          "hero_proof": "Verified Google Rating (4.9/5) + 'Trusted by 100+ Israeli SMBs' directly below CTA.",
          "mid_page_proof": "Alternating testimonial slider with owner photos and 'Leads per month' growth stats.",
          "end_page_reassurance": "No-cure no-pay guarantee or 'Launch in 7 days' speed promise near the final footer CTA."
        }
      },
      "user_flows": [
        {
          "flow_name": "Primary Conversion (The WhatsApp Bridge)",
          "steps": [
            {
              "screen": "Landing Page (Hero)",
              "user_intent": "Solve lead generation problem quickly",
              "action": "Click 'Start WhatsApp Chat'",
              "system_response": "Triggers WhatsApp Web or App with pre-filled local greeting"
            },
            {
              "screen": "WhatsApp Interaction",
              "user_intent": "Get a quote or ask a question",
              "action": "Send pre-filled message",
              "system_response": "Focus AI agent/owner responds instantly"
            }
          ],
          "drop_off_risks": [
            "User feels 'AI' means low quality",
            "Confusion between Hebrew and Arabic toggle",
            "Fear of sharing phone number"
          ],
          "friction_reducers": [
            "Dugri tone (direct benefits)",
            "Zero-form policy (click-to-chat only)",
            "High-contrast WhatsApp green button for familiarity"
          ]
        }
      ],
      "page_wireframes": [
        {
          "page_id": "home",
          "goal": "Convert cold traffic into WhatsApp inquiries via speed and trust signals",
          "sections": [
            {
              "id": "hero",
              "purpose": "Focus the user on the primary value proposition",
              "layout_structure": "Split-screen (Text Right, Image Left for RTL)",
              "content_blocks": [
                "Headline: Your site should start conversations, not just look pretty",
                "Sub-headline: AI-powered, multilingual sites that send leads straight to your WhatsApp"
              ],
              "primary_cta": "בואו נדבר בוואטסאפ (Start WhatsApp Chat)",
              "secondary_cta": "Show me a demo",
              "trust_element": "Floating badge: 98% lead response rate"
            },
            {
              "id": "the_friction",
              "purpose": "Call out the failure of traditional forms",
              "layout_structure": "Single column centered",
              "content_blocks": [
                "Comparison: The 'Dead Form' vs. The 'Focus AI Flow'",
                "Visual: 80% of Israelis prefer chatting over filling forms"
              ],
              "primary_cta": "Switch to Chat-First",
              "secondary_cta": null,
              "trust_element": "Data visualization of form abandonment"
            },
            {
              "id": "multilingual_showcase",
              "purpose": "Demonstrate the Hebrew/Arabic reach",
              "layout_structure": "Interactive toggle block",
              "content_blocks": [
                "Headline: One site, every Israeli customer",
                "Copy: Seamless RTL support for Hebrew and Arabic speakers"
              ],
              "primary_cta": "See Arabic Demo",
              "secondary_cta": null,
              "trust_element": "Flags/Icons of HE, AR, EN"
            }
          ]
        }
      ],
      "ui_system": {
        "design_tokens_reference": "implementation_tokens (colors: #004AAD, #25D366; fonts: Assistant, Cairo)",
        "components": {
          "button": {
            "variants": [
              "primary (WhatsApp Green #25D366)",
              "secondary (Deep Blue #004AAD)",
              "ghost (Border only)"
            ],
            "states": [
              "default",
              "hover (Slight scale 1.02)",
              "active (Slight scale 0.98)",
              "disabled",
              "loading (Spinner replacing text)"
            ],
            "rules": [
              "Primary buttons must always feature the WhatsApp icon on the right (for RTL) or left (for LTR)",
              "Text must be bold and action-oriented"
            ]
          },
          "card": {
            "variants": [
              "review (Owner image + quote)",
              "feature (Icon + punchy benefit)",
              "pricing (Vertical stack with checkmarks)"
            ],
            "rules": [
              "8px corner radius for a modern but professional feel",
              "Subtle shadow on hover to indicate interactivity",
              "RTL alignment for all card internal text"
            ]
          },
          "form": {
            "max_fields": 1,
            "inline_validation": true,
            "microcopy_position": "below input",
            "rules": [
              "Only use a form as a fall-back if WhatsApp is unavailable"
            ]
          },
          "navbar": {
            "behavior": "sticky with background blur",
            "cta_button": true,
            "mobile_pattern": "Bottom navigation for high reachability"
          },
          "testimonial_block": {
            "required_fields": [
              "Owner name",
              "Business logo",
              "Result metric (e.g. +40% leads)"
            ],
            "layout": "Avatar + Quote + Metric Badge"
          }
        }
      },
      "interaction_model": {
        "cta_behavior": [
          "Hero WhatsApp button opens new tab for desktop, deep-links app for mobile",
          "Sticky 'Chat with us' button appears on mobile after 30% scroll",
          "Language toggle instantly swaps DOM elements without page refresh (Nuxt i18n)"
        ],
        "motion_rules": [
          "Fade-in-up for section entry to maintain momentum",
          "Horizontal slide-in from the right for new elements in RTL view",
          "Hover elevation for pricing cards"
        ],
        "feedback_patterns": [
          "Clicking a phone number copies to clipboard and shows 'Copied!' tooltip",
          "Language switch shows a 0.5s loading skeleton to confirm transition"
        ]
      },
      "responsive_rules": {
        "breakpoints": [
          "mobile (under 640px)",
          "tablet (640px - 1024px)",
          "desktop (above 1024px)"
        ],
        "layout_changes": [
          "Mobile: Hero image moves above the headline to save horizontal space",
          "Mobile: Navigation becomes a bottom-docked sticky bar",
          "Tablet: Grid items move from 3-column to 2-column with center alignment"
        ]
      },
      "rtl_system": {
        "direction_switch": "Controlled via 'dir' attribute on body (rtl/ltr)",
        "mirroring_rules": [
          "Invert flex-direction for all navigation and footer items",
          "Reverse icon directions (e.g., 'back' arrow points right in RTL)",
          "Swap padding-left and padding-right values via Tailwind 'start' and 'end' utilities"
        ],
        "typography_rules": [
          "Hebrew: Use Assistant, letter-spacing: normal, line-height: 1.5",
          "Arabic: Use Cairo, increase line-height to 1.7 for visual balance",
          "Ensure headings in Arabic are 2px larger than Hebrew to maintain perceived hierarchy"
        ]
      },
      "conversion_engine": {
        "north_star_action": "WhatsApp Intent Trigger",
        "secondary_actions": [
          "Demo Video Play",
          "Pricing Table Scroll",
          "Review Expansion"
        ],
        "placement_rules": [
          "Top-right of header (Navigation)",
          "Center-bottom of Hero",
          "End of every 'Solution' section",
          "Sticky bottom on mobile"
        ],
        "psychological_triggers": [
          "Social Proof (Google ratings)",
          "Directness (Dugri) copy",
          "Scarcity (Limited monthly onboarding slots)",
          "Familiarity (WhatsApp branding triggers instant trust)"
        ]
      },
      "dev_handoff": {
        "pages_required": [
          "index (Home/Landing)",
          "pricing (Detailed offers)",
          "case-studies (Proof index)",
          "terms (Legal)"
        ],
        "analytics_events": [
          "whatsapp_lead_start",
          "language_toggle_ar",
          "language_toggle_he",
          "hero_cta_click",
          "pricing_view_full"
        ],
        "a_b_test_candidates": [
          "WhatsApp Button Copy: 'Start Chat' vs. 'Get Quote Now'",
          "Hero Image: 'Software Dashboard' vs. 'Happy Israeli Business Owner'",
          "Proof Placement: Immediately under H1 vs. under the Hero CTA"
        ]
      }
    }

    const copywrite = {
      "meta": {
        "schema_version": "1.0.0",
        "confidence": "high"
      },
      "global_messaging": {
        "value_proposition": {
          "en": "The fastest bridge between a customer's need and your WhatsApp inbox.",
          "he": "הגשר המהיר ביותר בין צורך של לקוח לבין הוואטסאפ שלך.",
          "ar": "أسرع جسر بين احتياجات العميل وصندوق الوارد الخاص بك على واتساب."
        },
        "one_liner": {
          "en": "AI-powered, multilingual websites that turn traffic into instant WhatsApp leads.",
          "he": "אתרים מבוססי בינה מלאכותית, רב-לשוניים, שהופכים תנועה ללידים מיידיים בוואטסאפ.",
          "ar": "مواقع مدعومة بالذكاء الاصطناعي، متعددة اللغات، تحول الزيارات إلى عملاء محتملين فوريين عبر واتساب."
        },
        "brand_story_short": {
          "en": "We saw local businesses losing 80% of their leads to 'Dead Forms'. Focus AI was built to replace friction with conversation, using AI to scale your business across every language in Israel.",
          "he": "ראינו עסקים מקומיים מאבדים 80% מהלידים בגלל טפסים מתים. הקמנו את Focus AI כדי להחליף חיכוך בשיחה, בעזרת בינה מלאכותית שמגדילה את העסק שלך בכל שפה בישראל.",
          "ar": "لقد رأينا شركات محلية تفقد 80% من عملائها المحتملين بسبب النماذج التقليدية. تم بناء Focus AI لاستبدال التعقيد بالمحادثة، باستخدام الذاء الاصطناعي لتوسيع نطاق عملك بكل اللغات في إسرائيل."
        }
      },
      "pages": [
        {
          "page_id": "home",
          "goal": "Convert cold traffic into WhatsApp inquiries via speed and trust signals",
          "sections": [
            {
              "id": "hero",
              "copy": {
                "headline": {
                  "en": "Your website should close deals, not just look pretty",
                  "he": "האתר שלך צריך לסגור עסקאות, לא רק להיראות יפה",
                  "ar": "يجب أن يغلق موقعك الصفقات، وليس فقط أن يبدو جميلاً"
                },
                "subheadline": {
                  "en": "Stop losing leads to boring forms. We build AI-powered sites that send customers straight to your WhatsApp in English, Hebrew, and Arabic.",
                  "he": "תפסיקו לאבד לידים בגלל טפסים משעממים. אנחנו בונים אתרים מבוססי AI ששולחים לקוחות ישר לוואטסאפ שלכם - בעברית, ערבית ואנגלית.",
                  "ar": "توقف عن خسارة العملاء بسبب النماذج المملة. نحن نبني مواقع مدعومة بالذكاء الاصطناعي ترسل العملاء مباشرة إلى واتساب الخاص بك - بالعربية، العبرية، والإنجليزية."
                },
                "body": {
                  "en": "Join 100+ Israeli SMBs who upgraded to a high-speed sales engine.",
                  "he": "הצטרפו ליותר מ-100 עסקים בישראל ששדרגו למנוע מכירות מהיר.",
                  "ar": "انضم إلى أكثر من 100 شركة إسرائيلية صغيرة ومتوسطة قامت بالترقية إلى محرك مبيعات سريع."
                },
                "primary_cta": {
                  "en": "Start WhatsApp Chat",
                  "he": "בואו נדבר בוואטסאפ",
                  "ar": "لنبدأ الدردشة عبر واتساب"
                },
                "secondary_cta": {
                  "en": "Show me a demo",
                  "he": "אני רוצה לראות דמו",
                  "ar": "أرني نسخة تجريبية"
                },
                "trust_line": {
                  "en": "98% lead response rate | Verified Google Rating 4.9/5",
                  "he": "98% אחוזי מענה ללידים | דירוג גוגל מאומת 4.9/5",
                  "ar": "معدل استجابة 98% | تقييم جوجل المعتمد 4.9/5"
                }
              }
            },
            {
              "id": "the_friction",
              "copy": {
                "headline": {
                  "en": "Is your 'Contact Us' form a lead graveyard?",
                  "he": "האם טופס ה-'צור קשר' שלך הוא בית קברות ללידים?",
                  "ar": "هل نموذج اتصل بنا الخاص بك هو مقبرة للعملاء المحتملين؟"
                },
                "subheadline": {
                  "en": "80% of Israelis prefer chatting over filling forms. If you don't offer WhatsApp, you're losing money.",
                  "he": "80% מהישראלים מעדיפים צ'אט על פני מילוי טפסים. אם אתם לא שם - אתם מפסידים כסף.",
                  "ar": "80% من الإسرائيليين يفضلون الدردشة على ملء النماذج. إذا كنت لا توفر واتساب، فأنت تخسر المال."
                },
                "body": {
                  "en": "Traditional sites wait for customers to find them. Focus AI sites engage customers instantly, removing the friction that kills conversions.",
                  "he": "אתרים מסורתיים מחכים שהלקוחות ימצאו אותם. אתרי Focus AI מייצרים אינטראקציה מיידית ומסירים את המכשולים שהורסים מכירות.",
                  "ar": "المواقع التقليدية تنتظر العثور عليها من قبل العملاء. مواقع Focus AI تتفاعل مع العملاء فوراً، وتزيل العقبات التي تقتل التحويلات."
                },
                "primary_cta": {
                  "en": "Switch to Chat-First",
                  "he": "עוברים לצ'אט תחילה",
                  "ar": "انتقل إلى نهج الدردشة أولاً"
                },
                "secondary_cta": {
                  "en": "See the data",
                  "he": "צפו בנתונים",
                  "ar": "شاهد البيانات"
                },
                "trust_line": {
                  "en": "Based on 2024 Israeli consumer behavior data.",
                  "he": "מבוסס על נתוני התנהגות צרכנים בישראל 2024.",
                  "ar": "بناءً على بيانات سلوك المستهلك الإسرائيلي لعام 2024."
                }
              }
            },
            {
              "id": "multilingual_showcase",
              "copy": {
                "headline": {
                  "en": "One site, every Israeli customer",
                  "he": "אתר אחד, לכל לקוח בישראל",
                  "ar": "موقع واحد، لكل عميل في إسرائيل"
                },
                "subheadline": {
                  "en": "Native RTL support for Hebrew and Arabic. Don't let language barriers limit your growth.",
                  "he": "תמיכה מובנית ב-RTL לעברית וערבית. אל תתנו למחסום השפה להגביל את הצמיחה שלכם.",
                  "ar": "دعم أصلي للغات التي تكتب من اليمين إلى اليسار (العبرية والعربية). لا تدع عوائق اللغة تحد من نموك."
                },
                "body": {
                  "en": "Our AI scales your message across languages flawlessly, ensuring your brand feels local to everyone.",
                  "he": "הבינה המלאכותית שלנו מתאימה את המסר שלכם לכל שפה בצורה מושלמת, כדי שהמותג שלכם ירגיש מקומי עבור כולם.",
                  "ar": "يقوم ذكاؤنا الاصطناعي بتوسيع نطاق رسالتك عبر اللغات بلا عيوب، مما يضمن أن علامتك التجارية تبدو محلية للجميع."
                },
                "primary_cta": {
                  "en": "See Arabic Demo",
                  "he": "צפו בדמו בערבית",
                  "ar": "شاهد الديمو بالعربية"
                },
                "secondary_cta": {
                  "en": "Explore Markets",
                  "he": "לחקור שווקים חדשים",
                  "ar": "استكشف الأسواق"
                },
                "trust_line": {
                  "en": "Perfect RTL rendering guaranteed.",
                  "he": "התחייבות לתצוגת RTL מושלמת.",
                  "ar": "نضمن عرضاً مثالياً للغات من اليمين إلى اليسار."
                }
              }
            }
          ]
        }
      ],
      "microcopy_system": {
        "form_labels": {
          "name": {
            "en": "Full Name",
            "he": "שם מלא",
            "ar": "الاسم الكامل"
          },
          "phone": {
            "en": "Phone Number",
            "he": "מספר טלפון",
            "ar": "رقم الهاتف"
          },
          "business_type": {
            "en": "Business Type",
            "he": "סוג העסק",
            "ar": "نوع العمل"
          }
        },
        "form_placeholders": {
          "en": {
            "name": "John Doe",
            "phone": "050-000-0000",
            "business_type": "e.g., Dental Clinic"
          },
          "he": {
            "name": "ישראל ישראלי",
            "phone": "050-000-0000",
            "business_type": "למשל: מרפאת שיניים"
          },
          "ar": {
            "name": "محمد علي",
            "phone": "050-000-0000",
            "business_type": "مثلاً: عيادة أسنان"
          }
        },
        "error_messages": {
          "required": {
            "en": "This field is required to start your chat.",
            "he": "שדה זה חובה כדי להתחיל את השיחה.",
            "ar": "هذا الحقل مطلوب لبدء الدردشة."
          }
        },
        "reassurance_copy": {
          "privacy": {
            "en": "Your number is used only to start the chat.",
            "he": "המספר שלך משמש רק לתחילת השיחה.",
            "ar": "يتم استخدام رقمك فقط لبدء الدردشة."
          },
          "response_time": {
            "en": "I'm online and ready to chat.",
            "he": "אני זמין עכשיו לשיחה.",
            "ar": "أنا متاح الآن للدردشة."
          }
        }
      },
      "cta_library": {
        "primary": {
          "en": [
            "Start WhatsApp Chat",
            "Get Leads Now",
            "Chat With Us"
          ],
          "he": [
            "בואו נדבר בוואטסאפ",
            "אני רוצה לידים עכשיו",
            "דברו איתנו"
          ],
          "ar": [
            "لنبدأ الدردشة عبر واتساب",
            "احصل على عملاء الآن",
            "تحدث معنا"
          ]
        },
        "secondary": {
          "en": [
            "I want a site like this",
            "See pricing",
            "View demo"
          ],
          "he": [
            "אני רוצה אתר כזה",
            "לצפייה במחירון",
            "צפו בדמו"
          ],
          "ar": [
            "أريد موقعاً كهذا",
            "شاهد الأسعار",
            "شاهد العرض"
          ]
        },
        "urgency": {
          "en": [
            "Limited slots for this month",
            "Launch in 7 days",
            "Get started in 2 minutes"
          ],
          "he": [
            "מקומות מוגבלים לחודש הקרוב",
            "עלייה לאוויר תוך 7 ימים",
            "מתחילים תוך 2 דקות"
          ],
          "ar": [
            "أماكن محدودة لهذا الشهر",
            "الانطلاق خلال 7 أيام",
            "ابدأ خلال دقيقتين"
          ]
        }
      },
      "objection_handling_blocks": [
        {
          "objection": "I already have a Wix site; why change?",
          "response": {
            "en": "Wix is a digital business card; Focus AI is a sales closer. We focus on the 3 seconds after someone lands to ensure they click WhatsApp.",
            "he": "וויקס הוא כרטיס ביקור דיגיטלי; Focus AI הוא סוגר עסקאות. אנחנו מתמקדים ב-3 השניות הראשונות כדי לוודא שהלקוח לוחץ על הוואטסאפ.",
            "ar": "ويكس هي بطاقة عمل رقمية؛ أما Focus AI فهو منجز صفقات. نحن نركز على الثواني الثلاث الأولى بعد وصول الزائر لضمان نقره على واتساب."
          }
        },
        {
          "objection": "Is AI content good enough?",
          "response": {
            "en": "We use AI for the heavy lifting, but our local strategists refine the tone to ensure it sounds like a human expert in your field.",
            "he": "אנחנו משתמשים ב-AI לעבודה הקשה, אבל האסטרטגים המקומיים שלנו מזקקים את הטון כדי לוודא שזה נשמע כמו מומחה אנושי בתחומך.",
            "ar": "نحن نستخدم الذكاء الاصطناعي للمهام الشاقة، لكن الاستراتيجيين المحليين لدينا يحسنون النبرة لضمان أنها تبدو كخبير بشري في مجالك."
          }
        }
      ],
      "seo_layer": {
        "home": {
          "title": {
            "en": "High-Conversion AI Websites for Israeli SMBs | Focus AI",
            "he": "אתרי בינה מלאכותית להמרות גבוהות לעסקים בישראל | Focus AI",
            "ar": "مواقع الذكاء الاصطناعي عالية التحويل للشركات الإسرائيلية | Focus AI"
          },
          "meta_description": {
            "en": "Turn traffic into WhatsApp leads. Multilingual, AI-powered websites designed for the Israeli market. Hebrew and Arabic native support.",
            "he": "הפכו תנועה ללידים בוואטסאפ. אתרים מבוססי AI, רב-לשוניים, המותאמים לשוק הישראלי עם תמיכה מלאה בעברית וערבית.",
            "ar": "حول الزيارات إلى عملاء محتملين عبر واتساب. مواقع متعددة اللغات مدعومة بالذكاء الاصطناعي ومصممة للسوق الإسرائيلي مع دعم أصلي للعربية والعبرية."
          },
          "keywords": [
            "WhatsApp leads Israel",
            "AI web design Hebrew",
            "High conversion websites Israel",
            "Arabic web design Israel",
            "אתרי וואטסאפ",
            "בניית אתרים AI"
          ]
        }
      },
      "experiment_variants": [
        {
          "section": "hero",
          "variant_a": {
            "headline": "Your website should close deals, not just look pretty"
          },
          "variant_b": {
            "headline": "Stop losing 80% of your leads to 'Dead Forms'"
          },
          "hypothesis": "Focusing on the specific pain point of form abandonment will drive higher WhatsApp click-through rates than a general value proposition."
        }
      ]
    }


    const plan = {
      "meta": {
        "schema_version": "1.0.0",
        "confidence": "high",
        "assumptions": [
          "The repository uses the Nuxt 4 'app/' directory structure as confirmed by the file tree.",
          "The Nuxt UI version is 4.x (v3 design system), compatible with Tailwind 4.",
          "The 'locales' directory at the root is the source of truth for translations, managed by @nuxtjs/i18n.",
          "RTL support is handled via the 'dir' attribute on the html element in the default layout."
        ]
      },
      "repo_discovery": {
        "repo": {
          "owner": "Brandi-Digital",
          "name": "test-3UkZWe",
          "default_branch": "main"
        },
        "framework": {
          "nuxt_detected": true,
          "nuxt_version_hint": "4.2.2",
          "modules": [
            "@nuxt/ui",
            "@nuxtjs/i18n",
            "@nuxt/eslint"
          ]
        },
        "ui": {
          "nuxt_ui_present": true,
          "nuxt_ui_version_hint": "4.4.0",
          "theme_files_found": [
            "app/app.config.ts",
            "app/assets/css/main.css"
          ]
        },
        "i18n": {
          "i18n_present": true,
          "locale_pattern": "single_file_per_locale",
          "locales_found": [
            "en",
            "he",
            "ar"
          ],
          "rtl_handling_found": [
            "app/layouts/default.vue (computed dir based on locale)"
          ]
        }
      },
      "capabilities": {
        "nuxt_mcp_tools_available": [
          "get-documentation-page",
          "get-module",
          "list-modules"
        ],
        "nuxt_ui_mcp_tools_available": [
          "get-component",
          "list-components",
          "get-component-metadata"
        ],
        "notes": [
          "Using Nuxt UI 3 (v4 package) which includes a modular component architecture.",
          "I18n is configured for lazy loading with language-specific directories."
        ]
      },
      "architecture_plan": {
        "route_map": [
          {
            "route": "/",
            "page_id": "home",
            "primary_goal": "Convert traffic to WhatsApp leads",
            "source_wireframe_page": "home"
          },
          {
            "route": "/pricing",
            "page_id": "pricing",
            "primary_goal": "Transparency and objection handling for high-tier services",
            "source_wireframe_page": "pricing"
          },
          {
            "route": "/case-studies",
            "page_id": "case_studies",
            "primary_goal": "Social proof and trust building",
            "source_wireframe_page": "case-studies"
          },
          {
            "route": "/terms",
            "page_id": "terms",
            "primary_goal": "Legal compliance",
            "source_wireframe_page": "terms"
          }
        ],
        "shared_components": [
          {
            "name": "AppHeader",
            "purpose": "Global navigation and language switching",
            "used_in": [
              "layouts/default.vue"
            ]
          },
          {
            "name": "AppFooter",
            "purpose": "Site links and trust signals",
            "used_in": [
              "layouts/default.vue"
            ]
          },
          {
            "name": "WhatsAppFAB",
            "purpose": "Floating conversion trigger",
            "used_in": [
              "layouts/default.vue"
            ]
          },
          {
            "name": "SectionSocialProof",
            "purpose": "Logo cloud and rating badge",
            "used_in": [
              "pages/index.vue"
            ]
          }
        ],
        "i18n_files": [
          {
            "page_id": "global",
            "files": {
              "en": "locales/en.json",
              "he": "locales/he.json",
              "ar": "locales/ar.json"
            }
          }
        ],
        "rtl_rules": [
          "Use 'start' and 'end' instead of 'left' and 'right' in Tailwind classes.",
          "Mirror icons that imply direction (arrows, progress).",
          "Ensure Cairo font has 1.7 line-height for Arabic readability.",
          "Flip flex-row and absolute positioning for RTL contexts."
        ],
        "analytics_events": [
          {
            "event": "whatsapp_click",
            "trigger": "Clicking any WhatsApp CTA",
            "properties": {
              "location": "hero|sticky|fab|footer"
            }
          },
          {
            "event": "language_switch",
            "trigger": "Changing language via toggle",
            "properties": {
              "from": "string",
              "to": "string"
            }
          }
        ]
      },
      "backlog": [
        {
          "id": "TASK-001",
          "title": "Configure Branding & Design Tokens",
          "priority": "p0",
          "depends_on": [],
          "acceptance": [
            "Primary color is set to #004AAD in app.config.ts",
            "Secondary color is set to #002B5B",
            "Accent color is set to #25D366 (WhatsApp Green)",
            "Fonts (Assistant, Cairo, Inter) are correctly mapped to locales"
          ],
          "estimated_files": [
            "app/app.config.ts",
            "app/assets/css/main.css"
          ]
        },
        {
          "id": "TASK-002",
          "title": "Build Social Proof & Case Studies Section",
          "priority": "p1",
          "depends_on": [
            "TASK-001"
          ],
          "acceptance": [
            "Section includes local Israeli business logos",
            "Shows Google Review rating badge",
            "Displays at least 3 local testimonials with results (+X% leads)"
          ],
          "estimated_files": [
            "app/components/sections/CaseStudiesSection.vue",
            "locales/*.json"
          ]
        },
        {
          "id": "TASK-003",
          "title": "Build 'Dugri' Pricing Section",
          "priority": "p1",
          "depends_on": [
            "TASK-001"
          ],
          "acceptance": [
            "Features 3 tiers: Basic, Growth, Enterprise",
            "Highlights 'Full Multilingual' in the middle tier",
            "Uses WhatsApp Green for primary CTA in the pricing table"
          ],
          "estimated_files": [
            "app/components/sections/PricingSection.vue",
            "app/pages/pricing.vue"
          ]
        },
        {
          "id": "TASK-004",
          "title": "Build FAQ & Objection Handling Section",
          "priority": "p1",
          "depends_on": [
            "TASK-001"
          ],
          "acceptance": [
            "Uses UAccordion for the 8 common objections",
            "Responses follow the 'Dugri' tone for each locale"
          ],
          "estimated_files": [
            "app/components/sections/FAQSection.vue"
          ]
        },
        {
          "id": "TASK-005",
          "title": "Implement Mobile Navigation & UX Refinement",
          "priority": "p1",
          "depends_on": [
            "TASK-001"
          ],
          "acceptance": [
            "Bottom sticky navigation bar on mobile devices",
            "Sticky 'Start Chat' button visible on scroll",
            "Language toggle is accessible and functional"
          ],
          "estimated_files": [
            "app/components/AppHeader.vue",
            "app/components/MobileNav.vue",
            "app/layouts/default.vue"
          ]
        }
      ],
      "file_plan": [
        {
          "path": "app/app.config.ts",
          "action": "update",
          "reason": "Apply branding colors and theme tokens",
          "notes": "Define colors as #004AAD, #002B5B, #25D366"
        },
        {
          "path": "app/pages/index.vue",
          "action": "update",
          "reason": "Incorporate all required landing page sections",
          "notes": "Add CaseStudies, Pricing, and FAQ sections"
        },
        {
          "path": "app/components/sections/CaseStudiesSection.vue",
          "action": "create",
          "reason": "New section for trust building",
          "notes": "Include local Israeli context and metrics"
        },
        {
          "path": "app/components/sections/PricingSection.vue",
          "action": "create",
          "reason": "Transparent pricing for conversion",
          "notes": "Use UCard or UPricingPlans"
        },
        {
          "path": "app/components/sections/FAQSection.vue",
          "action": "create",
          "reason": "Handle skepticism with direct answers",
          "notes": "Use UAccordion"
        },
        {
          "path": "app/pages/pricing.vue",
          "action": "create",
          "reason": "Detailed pricing page",
          "notes": "Deep dive into what each tier includes"
        },
        {
          "path": "app/pages/case-studies.vue",
          "action": "create",
          "reason": "Dedicated social proof page",
          "notes": "Portfolio index"
        },
        {
          "path": "app/pages/terms.vue",
          "action": "create",
          "reason": "Legal requirement",
          "notes": "Basic privacy and terms text in 3 languages"
        }
      ],
      "acceptance_criteria": {
        "functional": [
          "WhatsApp clicks deep-link correctly on mobile and open web tab on desktop",
          "Language switching persists via cookie and updates URL prefix",
          "All forms (if any) have validation for name/phone"
        ],
        "ux_conversion": [
          "Hero section contains social proof immediately under the headline",
          "Primary CTA is WhatsApp Green (#25D366) and highly visible",
          "Mobile bottom navigation allows easy thumb-access to conversion actions"
        ],
        "i18n_rtl": [
          "Hebrew and Arabic layouts are fully mirrored (text align right, flex direction reversed)",
          "Arabic (Cairo) and Hebrew (Assistant) fonts are correctly applied",
          "Horizontal scroll is disabled/fixed for RTL"
        ],
        "performance": [
          "Lighthouse performance score > 90",
          "Images are optimized and mirrored only where directionality matters"
        ]
      },
      "risks": [
        {
          "risk": "Arabic line-height mismatch",
          "impact": "medium",
          "mitigation": "Apply specific line-height (1.7) for Cairo font in the default layout"
        },
        {
          "risk": "Tailwind 4 / Nuxt UI 3 breaking changes",
          "impact": "low",
          "mitigation": "Use standard U-prefixed components and avoid deep overrides where possible"
        },
        {
          "risk": "I18n key drift between locales",
          "impact": "high",
          "mitigation": "Maintain strict synchronization of JSON keys across en, he, and ar files"
        }
      ],
      "handoff_to_dev_agent": {
        "ready": true,
        "dev_agent_inputs_required": [
          "Specific WhatsApp phone number for the deep-link",
          "Placeholders for Israeli client logos and testimonials"
        ],
        "execution_order_summary": [
          "1. Update theme colors and typography in app.config.ts",
          "2. Create the missing sections (CaseStudies, Pricing, FAQ)",
          "3. Expand index.vue and create multi-page routes",
          "4. Finalize i18n copy for all languages",
          "5. Implement mobile-specific navigation and sticky CTA"
        ]
      }
    }

    //  const deployment = await vercel.deployments.getDeployment({
    //   idOrUrl: 'dpl_2ePgm9UUaCopKhaRV7ux6UqVPg2h'
    //  })
    const deploymentEvents = await vercel.deployments.getDeploymentEvents({
      idOrUrl: 'dpl_2ePgm9UUaCopKhaRV7ux6UqVPg2h'
    })

    const input = {
      "repo": { "owner": process.env.GITHUB_OWNER, "repo": "test-3UkZWe", "ref": "main" },

      deploymentEvents
    }
    const debugAgent = await getDebugAgent()
    const output = await debugAgent.run(input, send)



    //deployment.readyState


    // const input = {
    //   "repo": { "owner": process.env.GITHUB_OWNER, "repo": "test-3UkZWe", "ref": "main" },
    //   "spec": { plan, brand_system, design_system, copywrite },
    //   "constraints": {
    //     "framework_preference": "nuxt",
    //     "ui_library": "Nuxt UI latest",
    //     "rtl_required": true,
    //     "locales": ["en", "he", "ar"]
    //   }
    // }
    // send({ type: "status", message: "started", payload: { input } });

    // const devAgent = await getDevAgent()
    // const output = await devAgent.run(input, send)

    send({ type: "status", message: "completed", payload: { output } });

    // deleteRun(runId);
    // cleanupRuns();


  })
);
