import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './PageTransition.css'

export const PageTransition = ({ children }) => {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('fadeIn')
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      setTransitionStage('fadeOut')
      prevPath.current = location.pathname
    }
  }, [location])

  return (
    <div
      className={`page-transition page-transition--${transitionStage}`}
      onAnimationEnd={() => {
        if (transitionStage === 'fadeOut') {
          setDisplayChildren(children)
          setTransitionStage('fadeIn')
        }
      }}
    >
      {displayChildren}
    </div>
  )
}

export default PageTransition