
import React from 'react';
import Modal from './Modal.tsx';

const TermsConditionsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Terms & Conditions" size="2xl">
            <div className="prose prose-sm dark:prose-invert max-w-none text-brand-text-secondary-light dark:text-brand-text-secondary space-y-4">
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                
                <h4>1. Acceptance of Terms</h4>
                <p>By accessing and using the Integrated Tourism Coordination and Monitoring System (INTOURCAMS), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>

                <h4>2. User Accounts and Responsibilities</h4>
                <p>To access certain features, you must register for an account. You agree to:</p>
                <ul>
                    <li>Provide true, accurate, current, and complete information about yourself as prompted by the registration form.</li>
                    <li>Maintain the security of your password and identification.</li>
                    <li>Be fully responsible for all use of your account and for any actions that take place using your account.</li>
                </ul>

                <h4>3. User Conduct and Content</h4>
                <p>You are solely responsible for all data, text, images, or other materials ("Content") that you upload, post, or otherwise transmit via the platform. You agree not to use the service to:</p>
                <ul>
                    <li>Upload any Content that is unlawful, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable.</li>
                    <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
                    <li>Upload any Content that you do not have a right to transmit under any law or under contractual or fiduciary relationships.</li>
                </ul>
                <p>We reserve the right, but have no obligation, to monitor and remove any Content that we deem, in our sole discretion, to violate these terms.</p>

                <h4>4. Intellectual Property</h4>
                <p>The platform and its original content, features, and functionality are and will remain the exclusive property of INTOURCAMS and its licensors. By submitting Content to the platform, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such Content in connection with operating and providing the service.</p>

                <h4>5. Disclaimers</h4>
                <p>The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the accuracy, reliability, or completeness of the content provided by users on the platform. Your use of the service is at your sole risk.</p>

                <h4>6. Limitation of Liability</h4>
                <p>In no event shall INTOURCAMS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>

                <h4>7. Termination</h4>
                <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>

                <h4>8. Governing Law</h4>
                <p>These Terms shall be governed and construed in accordance with the laws of Sarawak, Malaysia, without regard to its conflict of law provisions.</p>
                
                <h4>9. Changes to Terms</h4>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms & Conditions on this page.</p>

                <h4>10. Contact Us</h4>
                <p>If you have any questions about these Terms, please contact us at: intourcams@gmail.com</p>
            </div>
        </Modal>
    );
};
export default TermsConditionsModal;
