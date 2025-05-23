import React from 'react';
import CertificateSection from './CertificateSection'; // Adjust the path
import CoreJava from '../images/CoreJava.jpg';
import PythonForEveryBody from '../images/PythonForEveryBody.jpg';

function ImportantCertificates() {
    const sampleCertificates = [
        {
            image: CoreJava,
            name: 'Core Java Specialization',
            issuedBy: 'LearnQuest through Coursera',
            issuedOn: 'Feb 2024',
            verifyLink: 'https://coursera.org/verify/specialization/Q5RFAZVJ7DMZ'
        },
        {
            image: PythonForEveryBody,
            name: 'Python for Everybody Specialization',
            issuedBy: 'University of Michigan through Coursera',
            issuedOn: 'March 2024',
            verifyLink: 'https://coursera.org/verify/specialization/2KAXELVS3VQF'
        }
    ];

    return <CertificateSection title="Important Certificates" certificates={sampleCertificates} />;
}

export default ImportantCertificates;
