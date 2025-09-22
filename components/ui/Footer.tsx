
import React from 'react';
import { LogoIcon } from '../../constants.tsx';
import { useAppContext } from '../AppContext.tsx';
import Spinner from './Spinner.tsx';

const Footer: React.FC = () => {
    const { publicTotalVisits, isLoadingPublicTotalVisits } = useAppContext();

    const navigation = {
        about: [
            { name: 'Our Mission', href: '#' },
            { name: 'Careers', href: '#' },
            { name: 'Contact Us', href: '#' },
        ],
        legal: [
            { name: 'Privacy Policy', href: '#' },
            { name: 'Terms & Conditions', href: '#' },
            { name: 'Accessibility', href: '#' },
        ],
    };

    return (
        <footer className="bg-sidebar-bg-light dark:bg-sidebar-bg border-t border-neutral-300-light dark:border-neutral-700-dark" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">
                Footer
            </h2>
            <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8">
                        <LogoIcon className="h-12 w-auto" />
                        <p className="text-sm leading-6 text-brand-text-secondary-light dark:text-brand-text-secondary">
                            Integrated Tourism Coordination and Monitoring System.
                        </p>
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-brand-text-light dark:text-brand-text">About Us</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {navigation.about.map((item) => (
                                        <li key={item.name}>
                                            <a href={item.href} className="text-sm leading-6 text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-text-light dark:hover:text-brand-text">
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-brand-text-light dark:text-brand-text">Legal</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    {navigation.legal.map((item) => (
                                        <li key={item.name}>
                                            <a href={item.href} className="text-sm leading-6 text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-text-light dark:hover:text-brand-text">
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-1 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-brand-text-light dark:text-brand-text">Contact</h3>
                                <div className="mt-6 space-y-4 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                                    <p>Level 10, Menara Pehin Setia Raja<br />
                                    96400 Mukah<br />
                                    Sarawak</p>
                                    <p>Email: intourcams@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-16 border-t border-neutral-300-light dark:border-neutral-700-dark pt-8 sm:mt-20 lg:mt-24 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs leading-5 text-brand-text-secondary-light dark:text-brand-text-secondary">&copy; {new Date().getFullYear()} Integrated Tourism Coordination and Monitoring System. All rights reserved.</p>
                    <div className="flex items-center space-x-2 text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">
                        <span>Total Site Visits:</span>
                        {isLoadingPublicTotalVisits ? (
                            <Spinner className="w-4 h-4" />
                        ) : publicTotalVisits !== null ? (
                            <span className="font-semibold text-brand-text-light dark:text-brand-text">{publicTotalVisits.toLocaleString()}</span>
                        ) : (
                            <span>N/A</span>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;