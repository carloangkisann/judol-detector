import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Judol  <span className="text-pink-600"> Detector</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            An advanced gambling comment detection system for YouTube videos using multiple string matching algorithms. 
            Built to help content creators and platform moderators maintain safe, family-friendly communities by 
            automatically identifying and managing gambling-related content in video comments.
          </p>
        </div>

        {/* Algorithms */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Detection Algorithms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regular Expression (Regex)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed text-justify">
                  This method uses regular expressions to find specific patterns. For this project, it is used to detect gambling comments that follow a specific format: a word immediately followed by 2 or 3 numbers, such as &quot;Danantara77&quot; or &quot;Gacor88&quot;. Regex is also used to normalize specific unicode fonts in comments to prevent them from being hidden from detection.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Knuth-Morris-Pratt (KMP)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed text-justify">
                  The KMP algorithm is an efficient string-searching algorithm that avoids re-checking characters of the text that have already been matched. It achieves this by preprocessing the search pattern to create a &quot;partial match table&quot; (also known as a &quot;prefix table&quot; or &quot;LPS array&quot;). When a mismatch occurs, the algorithm uses this table to determine how far to shift the pattern to the right, skipping unnecessary comparisons. This results in a linear time complexity, making it very fast for finding exact pattern matches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Boyer-Moore</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed text-justify">
                  The Boyer-Moore algorithm is another highly efficient string-searching algorithm that is often used as a benchmark for practical string searches. A key feature of this algorithm is that it starts matching characters from the end of the pattern, moving backward. If a mismatch occurs, it uses two precomputed rules—the &quot;bad-character rule&quot; and the &quot;good-suffix rule&quot;—to determine the optimal number of characters to shift the pattern to the right. This allows it to skip sections of the text, often resulting in fewer comparisons than other algorithms and making it particularly fast when the pattern length increases.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rabin-Karp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed text-justify">
                 The Rabin-Karp algorithm uses a hashing technique to find a pattern within a text. It works by calculating a hash value for the pattern and for each successive substring of the text that has the same length as the pattern. It uses a &quot;rolling hash&quot; to efficiently update the hash value for each new substring without recomputing the entire hash from scratch. If the hash values match, a character-by-character comparison is then performed to confirm the match and avoid &quot;hash collisions&quot;. This algorithm is especially effective for searching for multiple patterns at once.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* How it Works */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    1
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">Enter Video URL</h4>
                  <p className="text-sm text-gray-600">
                    Simply paste any YouTube video URL or video ID into our detection form
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    2
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">Choose Algorithm</h4>
                  <p className="text-sm text-gray-600">
                    Select from multiple string matching algorithms: Regex, KMP, Boyer-Moore, or Rabin-Karp
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    3
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">Upload Patterns</h4>
                  <p className="text-sm text-gray-600">
                    Optionally upload custom pattern files for non-regex algorithms to enhance detection
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    4
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">Get Results</h4>
                  <p className="text-sm text-gray-600">
                    View comprehensive analysis with detected gambling comments and detailed statistics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}