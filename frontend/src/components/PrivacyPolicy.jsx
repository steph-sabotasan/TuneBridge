function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2026</p>

        {/* YouTube API Disclosure */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            YouTube Data API Services
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-gray-700">
              <strong>TuneBridge uses YouTube Data API Services.</strong>
            </p>
          </div>
          <p className="text-gray-600 mb-4">
            By using TuneBridge, you are also agreeing to be bound by the following policies:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
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
        </section>

        {/* What We Don't Do */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            What We Don't Collect or Store
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>
                  <strong>No User Login Required:</strong> TuneBridge does not require you to
                  log in with YouTube, Google, or any other account. We do not use OAuth
                  or any form of user authentication with YouTube.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>
                  <strong>No Personal Data Collection:</strong> We do not collect, store, or
                  share any personal information about you.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>
                  <strong>No Uploads to YouTube:</strong> TuneBridge only searches for
                  existing public videos on YouTube. We do not upload any content to
                  YouTube on your behalf.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>
                  <strong>No Cookies for Tracking:</strong> We do not use cookies to track
                  your activity across websites.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* What Data We Access */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            What YouTube Data We Access
          </h2>
          <p className="text-gray-600 mb-4">
            TuneBridge accesses only <strong>publicly available metadata</strong> from
            YouTube through the YouTube Data API. This includes:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Video ID</li>
            <li>Video title</li>
            <li>Channel name</li>
            <li>Video thumbnail URL</li>
          </ul>
          <p className="text-gray-600 mt-4">
            This information is used solely for the purpose of matching tracks from your
            source playlist to corresponding videos on YouTube. This data is processed
            in real-time and is not stored on our servers.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Third-Party Services
          </h2>
          <p className="text-gray-600 mb-4">
            TuneBridge integrates with the following third-party services:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>
              <strong>YouTube Data API:</strong> For searching and retrieving video
              information
            </li>
            <li>
              <strong>Spotify Web API:</strong> For fetching playlist track information
            </li>
          </ul>
          <p className="text-gray-600 mt-4">
            Each of these services has their own privacy policies. We encourage you to
            review them.
          </p>
        </section>

        {/* Changes to Policy */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Changes to This Policy
          </h2>
          <p className="text-gray-600">
            We may update this Privacy Policy from time to time. Any changes will be
            posted on this page with an updated revision date. We encourage you to review
            this Privacy Policy periodically.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy or our practices, please
            contact us at:
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

export default PrivacyPolicy;
