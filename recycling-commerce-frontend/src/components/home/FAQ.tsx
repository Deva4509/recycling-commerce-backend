import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is GreenCore?",
    answer:
      "GreenCore is a sustainable marketplace that brings together thoughtfully designed everyday products made from recycled, reclaimed, recovered, and upcycled materials.",
  },
  {
    question: "How are your products made?",
    answer:
      "Our products are created by giving recovered materials a new purpose. Different products use materials such as recycled cotton, reclaimed wood, recycled glass, and upcycled paper.",
  },
  {
    question: "Are your products made from recycled materials?",
    answer:
      "Yes. Our collection focuses on recycled, reclaimed, recovered, and upcycled materials, helping keep useful resources in circulation.",
  },
  {
    question: "How do I place an order?",
    answer:
      "Choose a product from the Shop, add it to your cart, review your items, and continue to checkout. Enter your shipping details, select a payment method, and place your order.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "GreenCore supports Cash on Delivery, UPI, cards, net banking, and supported digital wallets.",
  },
  {
    question: "How much does shipping cost?",
    answer:
      "Any applicable shipping charges are shown during checkout before you place your order, so you can review the complete order total before payment.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery time can vary depending on your location, product availability, and the shipping process. Your order status can be checked from your account.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "Eligible orders can be cancelled depending on their current status. If an order has already progressed to fulfillment or shipping, cancellation may no longer be available.",
  },
  {
    question: "What is your return/refund policy?",
    answer:
      "Return and refund eligibility depends on the product and order condition. Please check the applicable return information for your purchase or contact support for assistance.",
  },
  {
    question: "How can I track my order?",
    answer:
      "You can view your orders and their current status from the Account section. Shipment tracking information can be provided when it becomes available for your order.",
  },
  {
    question: "How can I contact support?",
    answer:
      "For help with an order or any other question, contact the GreenCore support team through the support contact information provided on the website.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="faq-section" id="faqs">
      <div className="faq-container">
        <div className="faq-heading">
          <div>
            <span className="faq-kicker">HELP CENTER</span>
            <h2>Frequently asked questions</h2>
            <p>
              Everything you need to know about shopping sustainably with
              GreenCore.
            </p>
          </div>

          <div className="faq-heading-icon">
            <HelpCircle size={27} />
          </div>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                className={`faq-item ${isOpen ? "open" : ""}`}
                key={faq.question}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    {faq.question}
                  </span>

                  <ChevronDown size={18} />
                </button>

                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
