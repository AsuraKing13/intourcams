
import React from 'react';
import Modal from './Modal.tsx';

const PrivacyPolicyModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" size="2xl">
            <div className="prose prose-sm dark:prose-invert max-w-none text-brand-text-secondary-light dark:text-brand-text-secondary space-y-4">
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                
                <h4>1. Introduction</h4>
                <p>Welcome to INTOURCAMS ("we", "our", "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using INTOURCAMS, you agree to the collection and use of information in accordance with this policy.</p>

                <h4>2. Information We Collect</h4>
                <p>We may collect information about you in a variety of ways. The information we may collect on the platform includes:</p>
                <ul>
                    <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and contact number, that you voluntarily give to us when you register with the platform or when you choose to participate in various activities related to the platform, such as submitting grant applications or feedback.</li>
                    <li><strong>User-Generated Content:</strong> Information you provide when you create or manage tourism clusters, submit grant applications, post reviews, or submit feedback. This includes text, images, and other data you upload.</li>
                    <li><strong>Usage Data:</strong> Information our servers automatically collect when you access the platform, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the platform.</li>
                </ul>

                <h4>3. How We Use Your Information</h4>
                <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the platform to:</p>
                <ul>
                    <li>Create and manage your account.</li>
                    <li>Process your grant applications and track their status.</li>
                    <li>Display your user-generated content, such as cluster information and reviews.</li>
                    <li>Monitor and analyze usage and trends to improve your experience with the platform.</li>
                    <li>Generate anonymized, aggregated statistical data for tourism analysis and reporting by the Sarawak government and associated bodies.</li>
                    <li>Respond to your feedback and support requests.</li>
                </ul>

                <h4>4. Disclosure of Your Information</h4>
                <p>We do not share your personal information with third parties except in the circumstances described below:</p>
                <ul>
                    <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                    <li><strong>Aggregated Data:</strong> We may share aggregated and anonymized information with government partners for tourism planning and statistical analysis. This information does not contain any personal data.</li>
                    <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service contractors, or agents who perform services for us or on our behalf, such as data storage and hosting.</li>
                </ul>

                <h4>5. Security of Your Information</h4>
                <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

                <h4>6. Your Rights</h4>
                <p>You have the right to review, change, or terminate your account at any time. You can review or change the information in your account or terminate your account by logging into your account settings and updating your account, or by contacting us using the contact information provided below.</p>
                
                <h4>7. Changes to This Privacy Policy</h4>
                <p>We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
                
                <h4>8. Contact Us</h4>
                <p>If you have questions or comments about this Privacy Policy, please contact us at: intourcams@gmail.com</p>
            </div>
        </Modal>
    );
};
export default PrivacyPolicyModal;
