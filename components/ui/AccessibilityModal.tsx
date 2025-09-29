
import React from 'react';
import Modal from './Modal.tsx';

const AccessibilityModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Accessibility Statement" size="2xl">
            <div className="prose prose-sm dark:prose-invert max-w-none text-brand-text-secondary-light dark:text-brand-text-secondary space-y-4">
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                
                <h4>1. Our Commitment</h4>
                <p>INTOURCAMS is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards, such as the Web Content Accessibility Guidelines (WCAG) 2.1.</p>

                <h4>2. Measures We Have Taken</h4>
                <p>We have implemented the following features to make our platform more accessible:</p>
                <ul>
                    <li><strong>Font Size Adjustment:</strong> Users can increase the font size across the application for better readability through the accessibility menu in the header.</li>
                    <li><strong>High-Contrast Mode:</strong> A high-contrast mode is available to ensure text is easily distinguishable from the background. This can be activated from the accessibility menu.</li>
                    <li><strong>Keyboard Navigation:</strong> All interactive elements of the application are reachable and operable using a keyboard. We have also implemented enhanced visual focus indicators to make keyboard navigation clearer.</li>
                    <li><strong>Semantic HTML and ARIA:</strong> We use semantic HTML5 and ARIA (Accessible Rich Internet Applications) attributes where appropriate to improve navigation and understanding for users of screen readers and other assistive technologies.</li>
                    <li><strong>Responsive Design:</strong> The platform is designed to be responsive and usable across a wide range of screen sizes and devices, from desktops to mobile phones.</li>
                </ul>

                <h4>3. Ongoing Efforts</h4>
                <p>We understand that accessibility is an ongoing effort. We are continuously seeking out solutions that will bring all areas of the site up to the same level of overall web accessibility. We regularly review our site to identify and fix any accessibility issues.</p>
                
                <h4>4. Feedback</h4>
                <p>We welcome your feedback on the accessibility of INTOURCAMS. If you encounter accessibility barriers or have suggestions on how we can improve, please let us know:</p>
                <ul>
                    <li><strong>Email:</strong> intourcams@gmail.com</li>
                    <li>You can also submit feedback directly through the "System Feedback" section in your Profile Settings.</li>
                </ul>
                <p>We try to respond to feedback within 5 business days.</p>
            </div>
        </Modal>
    );
};

export default AccessibilityModal;