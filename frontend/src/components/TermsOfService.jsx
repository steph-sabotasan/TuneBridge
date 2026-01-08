function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2026</p>

        {/* Introduction */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="text-gray-600">
            By accessing and using TuneBridge, you accept and agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use our
            service.
          </p>
        </section>

        {/* Service Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            2. Description of Service
          </h2>
          <p className="text-gray-600">
            TuneBridge is a playlist conversion tool that helps users find matching
            content across different music streaming platforms. The service searches for
            publicly available content and provides links to third-party platforms.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            3. Third-Party Services
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700">
              <strong>TuneBridge uses YouTube Data API Services.</strong>
            </p>
          </div>
          <p className="text-gray-600 mb-4">
            By using TuneBridge, you also agree to be bound by:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline"
              >
                YouTube Terms of Service
              </a>
            </li>
            <li>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline"
              >
                Google Privacy Policy
              </a>
            </li>
          </ul>
          <p className="text-gray-600 mt-4">
            TuneBridge also integrates with Spotify Web API. Usage is subject to{' '}
            <a
              href="https://www.spotify.com/legal/end-user-agreement/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 underline"
            >
              Spotify's Terms of Service
            </a>
            .
          </p>
        </section>

        {/* User Responsibilities */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            4. User Responsibilities
          </h2>
          <p className="text-gray-600 mb-4">When using TuneBridge, you agree to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Use the service only for lawful purposes</li>
            <li>Not attempt to circumvent any security measures</li>
            <li>Not use automated tools to excessively access the service</li>
            <li>Respect the intellectual property rights of content creators</li>
            <li>
              Not use the service in any way that violates YouTube's or Spotify's terms
              of service
            </li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            5. Intellectual Property
          </h2>
          <p className="text-gray-600">
            TuneBridge does not claim ownership of any content accessed through third-party
            services. All music, videos, and related content remain the property of their
            respective owners. TuneBridge only provides links to content hosted on
            third-party platforms.
          </p>
        </section>

        {/* Disclaimers */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Disclaimers</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>No Guarantee of Accuracy:</strong> TuneBridge uses automated
                matching algorithms. We cannot guarantee that matches will always be
                accurate or that the correct content will be found.
              </li>
              <li>
                <strong>Third-Party Content:</strong> We are not responsible for the
                content, availability, or quality of videos or tracks on third-party
                platforms.
              </li>
              <li>
                <strong>Service Availability:</strong> TuneBridge is provided "as is"
                without warranty. We do not guarantee uninterrupted or error-free service.
              </li>
              <li>
                <strong>API Limitations:</strong> Our service depends on third-party APIs
                which may have rate limits, quotas, or availability issues beyond our
                control.
              </li>
            </ul>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            7. Limitation of Liability
          </h2>
          <p className="text-gray-600">
            To the fullest extent permitted by law, TuneBridge and its developers shall
            not be liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of the service.
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            8. Changes to These Terms
          </h2>
          <p className="text-gray-600">
            We reserve the right to modify these Terms of Service at any time. Changes
            will be posted on this page with an updated revision date. Continued use of
            the service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Contact</h2>
          <p className="text-gray-600">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p className="mt-2">
            <a
              href="mailto:tunebridge.contact@gmail.com"
              className="text-purple-600 hover:text-purple-800 underline font-medium"
            >
              tunebridge.contact@gmail.com
            </a>
          </p>
        </section>

        {/* Back Link */}
        <div className="border-t border-gray-200 pt-6">
          <a
            href="/"
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to TuneBridge
          </a>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
