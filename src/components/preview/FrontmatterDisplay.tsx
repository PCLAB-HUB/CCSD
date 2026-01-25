import { FC } from 'react'
import { formatFrontmatterValue } from '../../utils/markdownParser'

interface FrontmatterDisplayProps {
  frontmatter: Record<string, unknown>
  darkMode: boolean
}

const FrontmatterDisplay: FC<FrontmatterDisplayProps> = ({ frontmatter, darkMode }) => {
  const entries = Object.entries(frontmatter)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className={`
      mb-4 rounded-lg border overflow-hidden
      ${darkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-gray-50 border-gray-200'
      }
    `}>
      <div className={`
        px-4 py-2 text-sm font-medium border-b
        ${darkMode
          ? 'bg-gray-700 border-gray-600 text-gray-200'
          : 'bg-gray-100 border-gray-200 text-gray-700'
        }
      `}>
        Frontmatter
      </div>
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value]) => (
            <tr
              key={key}
              className={`
                border-b last:border-b-0
                ${darkMode ? 'border-gray-700' : 'border-gray-200'}
              `}
            >
              <td className={`
                px-4 py-2 font-medium whitespace-nowrap align-top
                ${darkMode ? 'text-blue-400' : 'text-blue-600'}
              `}>
                {key}
              </td>
              <td className={`
                px-4 py-2 font-mono text-xs
                ${darkMode ? 'text-gray-300' : 'text-gray-600'}
              `}>
                <pre className="whitespace-pre-wrap break-all">
                  {formatFrontmatterValue(value)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default FrontmatterDisplay
